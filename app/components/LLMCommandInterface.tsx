'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface LLMCommandResult {
  action?: string
  target?: string
  parameters?: Record<string, unknown>
  confidence?: number
  reasoning?: string
  safety_approved?: boolean
}

interface LLMCommandInterfaceProps {
  mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'
  availableDrones: string[]
  onCommandProcessed?: (command: LLMCommandResult) => void
}

export default function LLMCommandInterface({ mode, availableDrones, onCommandProcessed }: LLMCommandInterfaceProps) {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [command, setCommand] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{
    command?: LLMCommandResult
    alternatives?: Array<{ action: string; confidence: number; reasoning?: string }>
    safety_warnings?: string[]
  } | null>(null)

  const handleSubmit = async () => {
    if (!command.trim() || isProcessing) return

    // Sanitize and validate command input
    const sanitizedCommand = String(command || '').trim().slice(0, 1000)
    if (!sanitizedCommand) {
      showError('Command cannot be empty')
      return
    }

    // Validate mode if provided
    if (mode && !['cattle', 'hunting', 'people', 'filming', 'fishing', 'mining'].includes(mode)) {
      showError('Invalid mode')
      return
    }

    // Validate availableDrones is an array
    const validDrones = Array.isArray(availableDrones) 
      ? availableDrones.filter((id): id is string => typeof id === 'string').slice(0, 100)
      : []

    setIsProcessing(true)
    try {
      const response = await fetchWithAuth('/api/civilian/drone/ai-command', {
        method: 'POST',
        body: JSON.stringify({
          command: sanitizedCommand,
          mode: mode || null,
          availableDrones: validDrones,
        }),
      }) as {
        command?: LLMCommandResult
        alternatives?: Array<{ action: string; confidence: number; reasoning?: string }>
        safety_warnings?: string[]
      } | null

      setResult(response)
      
      if (response?.command?.safety_approved) {
        success('Command processed successfully!')
        if (onCommandProcessed && response.command) {
          onCommandProcessed(response.command)
        }
      } else {
        showError('Command requires safety review: ' + (response?.safety_warnings?.join(', ') || 'Unknown issue'))
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process command'
      logger.error('Failed to process LLM command:', err)
      showError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="card-glass p-6">
      <h3 className="text-xl font-bold text-white mb-4">AI Command Interface</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-300 mb-2 block">
            Describe what you want the drones to do:
          </label>
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g., 'Move drone 1 to coordinates 37.7749, -122.4194 at 100 meters altitude'"
            className="w-full glass border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 min-h-[120px]"
            disabled={isProcessing}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isProcessing || !command.trim()}
          className="btn-primary w-full"
        >
          {isProcessing ? 'Processing...' : 'Process Command'}
        </button>

        {result && (
          <div className="space-y-3">
            <div className="glass border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">Action:</span>
                <span className="text-blue-300">{result.command?.action}</span>
              </div>
              <div className="text-sm text-slate-300 mb-2">
                <div>Confidence: {((result.command?.confidence ?? 0) * 100).toFixed(1)}%</div>
                <div className="mt-1">Reasoning: {result.command?.reasoning}</div>
              </div>
              {result.command?.parameters && (
                <div className="mt-2 text-xs text-slate-400">
                  Parameters: {JSON.stringify(result.command.parameters)}
                </div>
              )}
            </div>

            {result.safety_warnings && result.safety_warnings.length > 0 && (
              <div className="glass border border-red-500/30 rounded-lg p-4">
                <div className="text-sm font-semibold text-red-400 mb-2">Safety Warnings:</div>
                <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
                  {result.safety_warnings.map((warning: string, i: number) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.alternatives && result.alternatives.length > 0 && (
              <div className="glass border border-white/10 rounded-lg p-4">
                <div className="text-sm font-semibold text-slate-300 mb-2">Alternative Interpretations:</div>
                <div className="space-y-2">
                  {result.alternatives.map((alt, i: number) => (
                    <div key={i} className="text-xs text-slate-400">
                      {alt.action} ({(alt.confidence * 100).toFixed(0)}% confidence)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
