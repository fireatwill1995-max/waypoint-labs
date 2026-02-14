'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { logger } from '../lib/logger'

interface VoiceControlProps {
  onCommand?: (command: string) => void
  /** When set, transcript is also sent to the AI chat (conversational flow). Parent should clear after consuming. */
  onTranscriptForAI?: (text: string) => void
  enabled?: boolean
}

export default function VoiceControl({ onCommand, onTranscriptForAI, enabled = true }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    onstart: (() => void) | null
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
  }
  interface SpeechRecognitionEvent {
    resultIndex: number
    results: SpeechRecognitionResultList
  }
  interface SpeechRecognitionResultList {
    length: number
    [index: number]: SpeechRecognitionResult
  }
  interface SpeechRecognitionResult {
    isFinal: boolean
    [index: number]: SpeechRecognitionAlternative
  }
  interface SpeechRecognitionAlternative {
    transcript: string
  }
  interface SpeechRecognitionErrorEvent {
    error: string
  }
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const lastFinalTranscriptRef = useRef('')

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    interface WindowWithSpeechRecognition extends Window {
      SpeechRecognition?: new () => SpeechRecognition
      webkitSpeechRecognition?: new () => SpeechRecognition
    }
    const SpeechRecognitionClass = (window as unknown as WindowWithSpeechRecognition).SpeechRecognition ||
      (window as unknown as WindowWithSpeechRecognition).webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)
    cleanup()

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''

      if (!event?.results || typeof event.resultIndex !== 'number' ||
          event.resultIndex < 0 || event.resultIndex >= event.results.length) {
        return
      }

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result?.[0] && typeof result[0].transcript === 'string') {
          const t = String(result[0].transcript).slice(0, 1000)
          if (result.isFinal) {
            finalTranscript += t + ' '
          } else {
            interimTranscript += t
          }
        }
      }

      if (finalTranscript) lastFinalTranscriptRef.current = finalTranscript.trim()
      setTranscript(finalTranscript || interimTranscript)
      if (finalTranscript.trim()) onCommand?.(finalTranscript.trim())
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        logger.error('Speech recognition error:', event.error)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      const toSend = lastFinalTranscriptRef.current
      if (onTranscriptForAI && toSend.length >= 3) {
        onTranscriptForAI(toSend)
        lastFinalTranscriptRef.current = ''
      }
    }

    recognitionRef.current = recognition
    return () => { cleanup() }
  }, [enabled, cleanup, onCommand, onTranscriptForAI])

  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      try {
        recognitionRef.current.stop()
        setIsListening(false)
      } catch {
        setIsListening(false)
      }
    } else {
      try {
        recognitionRef.current.start()
      } catch (e) {
        logger.error('Failed to start recognition:', e)
        setIsListening(false)
      }
    }
  }

  if (!isSupported) {
    return (
      <div className="card-dji p-4 border-2 border-amber-500/40">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm text-amber-400 font-semibold font-futuristic">Voice not supported</p>
            <p className="text-xs text-slate-400 font-futuristic">Use Chrome or Edge for voice commands</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-dji p-4 border-2 border-dji-500/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white font-futuristic">Voice control</h3>
        <button
          type="button"
          onClick={toggleListening}
          className={`px-4 py-2 rounded-xl font-semibold transition-all touch-target font-futuristic ${
            isListening
              ? 'bg-red-500/90 hover:bg-red-600 text-white border border-red-400/50'
              : 'btn-dji text-sm py-2 px-4'
          }`}
        >
          {isListening ? (
            <>
              <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse" aria-hidden />
              Stop
            </>
          ) : (
            <>
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Start listening
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-dji-400/90 mb-3 font-futuristic">
        Use your headset or built-in mic. Commands go to the AI — confirm in chat to run actions.
      </p>

      {isListening && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-300 font-futuristic">
            <div className="w-2 h-2 bg-dji-400 rounded-full animate-pulse" aria-hidden />
            <span>Listening…</span>
          </div>

          {transcript && (
            <div className="glass-dji border border-dji-500/20 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1 font-futuristic">Heard:</div>
              <div className="text-sm text-white font-futuristic">{transcript}</div>
            </div>
          )}

          <div className="text-xs text-slate-400 font-futuristic">
            <p className="font-semibold mb-1">Examples:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Plan a mustering route to the north paddock</li>
              <li>Execute the mission</li>
              <li>Return all drones to base</li>
              <li>Add a waypoint at current position</li>
            </ul>
          </div>
        </div>
      )}

      {!isListening && (
        <p className="text-sm text-slate-400 font-futuristic">
          Start listening, then speak. Your words are sent to the AI; say &quot;confirm&quot; or tap Confirm in chat to run.
        </p>
      )}
    </div>
  )
}
