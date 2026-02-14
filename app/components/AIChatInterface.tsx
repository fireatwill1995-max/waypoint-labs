'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useApi } from '../lib/api'
import { logger } from '../lib/logger'
import { useToast } from '../hooks/useToast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  /** When set, this message has an associated proposed action to confirm */
  proposedAction?: ProposedAction
}

interface ProposedAction {
  type: 'apply_route' | 'execute_mission'
  label: string
  payload?: unknown
}

interface RoutePlan {
  waypoints?: Array<{ lat: number; lon: number; alt?: number }>
  [key: string]: unknown
}

interface AIChatInterfaceProps {
  mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining' | null
  onRouteGenerated?: (route: RoutePlan) => void
  onAdviceReceived?: (advice: string) => void
  /** When AI proposes execute_mission and user confirms, call this to run the mission */
  onExecuteMission?: () => void | Promise<void>
  waypointsCount?: number
  /** When set, treat as a user message from voice and send to AI (then clear by parent) */
  incomingVoiceTranscript?: string | null
  /** Speak assistant replies aloud (headphones/speakers) */
  voiceReplyEnabled?: boolean
  onVoiceTranscriptConsumed?: () => void
}

export default function AIChatInterface({
  mode,
  onRouteGenerated,
  onAdviceReceived,
  onExecuteMission,
  waypointsCount = 0,
  incomingVoiceTranscript,
  voiceReplyEnabled = true,
  onVoiceTranscriptConsumed,
}: AIChatInterfaceProps) {
  const { fetchWithAuth } = useApi()
  const { error: showError, success } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const speak = useCallback((text: string) => {
    if (!voiceReplyEnabled || !text.trim()) return
    try {
      const s = synthRef.current
      if (!s) return
      const u = new SpeechSynthesisUtterance(text.slice(0, 500))
      u.rate = 0.95
      u.pitch = 1
      u.lang = 'en-US'
      s.cancel()
      s.speak(u)
    } catch {
      // ignore
    }
  }, [voiceReplyEnabled])

  useEffect(() => {
    const modeLabel = mode === 'cattle' ? 'cattle management' : mode === 'hunting' ? 'hunting operations' : mode === 'people' ? 'people recognition' : mode === 'filming' ? 'filming' : mode === 'mining' ? 'mining operations (Australia)' : 'fishing operations'
    setMessages([{
      id: '1',
      role: 'assistant',
      content: mode
        ? `Hello! I'm your AI assistant for ${modeLabel}. You can chat with me naturally or use voice commands (e.g. from your headset). Tell me what you want to do and I can plan routes or suggest actions. When we agree, confirm and I'll carry out the action instantly.`
        : "Hello! I'm your AI assistant. Select a mode to get started with mission planning.",
      timestamp: new Date()
    }])
  }, [mode])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /** When voice sends a transcript, add it as a user message and get AI response */
  useEffect(() => {
    if (!incomingVoiceTranscript?.trim() || !mode) return
    const text = incomingVoiceTranscript.trim().slice(0, 2000)
    const userMessage: Message = {
      id: `voice-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    const historyForAI = [...messages, userMessage].slice(-11).map(m => ({
      role: m.role,
      content: String(m.content || '').slice(0, 2000)
    }))
    setMessages(prev => [...prev, userMessage])
    onVoiceTranscriptConsumed?.()
    sendToAI(userMessage, historyForAI)
    // Only run when parent sets a new voice transcript; history is current at invoke time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingVoiceTranscript])

  const sendToAI = async (userMessage: Message, conversationOverride?: { role: string; content: string }[]) => {
    if (!mode) return
    setIsLoading(true)
    try {
      const messageContent = String(userMessage.content || '').trim().slice(0, 2000)
      if (!messageContent) {
        setIsLoading(false)
        return
      }
      if (!['cattle', 'hunting', 'people', 'filming', 'fishing', 'mining'].includes(mode)) {
        showError('Invalid mode')
        setIsLoading(false)
        return
      }

      const history = conversationOverride ?? messages.slice(-10).map(m => ({
        role: m.role,
        content: String(m.content || '').slice(0, 2000)
      }))

      const response = await fetchWithAuth('/api/civilian/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: messageContent,
          mode,
          conversation_history: history
        })
      }) as {
        response?: string
        route?: RoutePlan
        advice?: string
        proposed_action?: { type: string; label?: string; payload?: unknown }
        error?: string
      }

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from server')
      }

      const rawContent = response.response || response.advice ||
        `I understand: "${userMessage.content}". I can help plan or execute when you're ready.`
      const assistantContent = String(rawContent || '').slice(0, 10000)

      const proposedAction: ProposedAction | undefined = response.proposed_action?.type === 'execute_mission'
        ? { type: 'execute_mission', label: response.proposed_action?.label || 'Execute mission', payload: response.proposed_action?.payload }
        : response.route
          ? { type: 'apply_route', label: 'Apply this route', payload: response.route }
          : undefined

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        proposedAction
      }

      setMessages(prev => [...prev, assistantMessage])

      if (response.route && onRouteGenerated) {
        onRouteGenerated(response.route)
      }
      if (response.advice && onAdviceReceived) {
        onAdviceReceived(response.advice)
      } else if (onAdviceReceived) {
        onAdviceReceived(assistantContent)
      }

      if (proposedAction) {
        speak(`${assistantContent.slice(0, 120)}. Say confirm or tap the button to run the action.`)
      } else {
        speak(assistantContent.slice(0, 200))
      }
    } catch (error) {
      logger.error('Error sending message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.'
      showError(errorMessage)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    const history = nextMessages.slice(-11).map(m => ({ role: m.role, content: String(m.content || '').slice(0, 2000) }))
    await sendToAI(userMessage, history)
  }

  const handleConfirmAction = async (messageId: string, action: ProposedAction) => {
    if (action.type === 'apply_route') {
      success('Route applied.')
    }
    if (action.type === 'execute_mission' && onExecuteMission) {
      try {
        await onExecuteMission()
        success('Mission executed.')
        speak('Mission started.')
      } catch (e) {
        showError(e instanceof Error ? e.message : 'Execute failed')
      }
    }
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, proposedAction: undefined } : m))
  }

  const handleDismissAction = (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, proposedAction: undefined } : m))
  }

  const quickActions = mode === 'cattle'
    ? ['Mustering to corral', 'Health check survey', 'Count livestock', 'Find missing animals']
    : mode === 'hunting'
      ? ['Scout game location', 'Plan approach route', 'Estimate distance', 'Check wind direction']
      : mode === 'people'
        ? ['Identify person', 'Track movement', 'Count people', 'Security check']
        : mode === 'fishing'
          ? ['Scout fish schools', 'Deploy bait here', 'Map underwater structures', 'Check water quality', 'Find fishing hotspots', 'Start sonar mapping', 'Deploy swarm scout', 'Analyze water conditions']
          : mode === 'mining'
            ? ['Plan pit survey grid', 'Inspection route for conveyors', 'Check CASA compliance', 'Blast exclusion zone', 'Stockpile volume estimate', 'Incident response route']
            : ['Follow subject', 'Cinematic shot', 'Event coverage', 'Aerial view']

  return (
    <div className="card-dji h-full flex flex-col relative z-[60] isolate border-2 border-dji-500/20">
      <div className="flex items-center gap-3 p-4 border-b border-dji-500/20 relative z-[60]">
        <div className="w-10 h-10 bg-gradient-to-br from-dji-500 to-dji-600 rounded-xl flex items-center justify-center border border-dji-400/40">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white font-futuristic">AI Assistant — Chat &amp; Voice</h3>
          <p className="text-xs text-slate-400 font-futuristic">Converse naturally; confirm to run actions instantly</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[90%] space-y-2">
              <div
                className={`rounded-xl p-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-dji-500 to-dji-600 text-white border border-dji-400/30'
                    : 'glass-dji border border-dji-500/20 text-slate-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap font-futuristic">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.proposedAction && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-dji-400 font-futuristic">
                    {message.proposedAction.type === 'execute_mission' && waypointsCount > 0
                      ? `${message.proposedAction.label} (${waypointsCount} waypoints)`
                      : message.proposedAction.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleConfirmAction(message.id, message.proposedAction!)}
                    className="btn-dji text-sm py-2 px-4"
                  >
                    Confirm — run now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismissAction(message.id)}
                    className="btn-dji-secondary text-sm py-2 px-4"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-dji border border-dji-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-dji-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-dji-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-dji-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {quickActions.length > 0 && (
        <div className="p-4 border-t border-dji-500/20">
          <p className="text-xs text-slate-400 mb-2 font-futuristic">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action)}
                className="px-3 py-1.5 text-xs glass-dji border border-dji-500/30 rounded-lg hover:border-dji-500/50 transition-colors text-dji-300 hover:text-white font-futuristic"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-dji-500/20">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type or use voice (headset) to plan and run missions..."
            className="flex-1 input-dji rounded-xl px-4 py-3 text-sm resize-none min-h-[44px]"
            rows={2}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="btn-dji px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
