'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'
import type { AIDroneCommand, CoordinationPattern, DroneInstance } from '../types/api'

interface AIDroneCommandInterfaceProps {
  mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'
  drones: DroneInstance[]
  onCommandExecuted?: () => void
}

// Predefined coordination patterns based on research
const coordinationPatterns: Record<string, CoordinationPattern[]> = {
  cattle: [
    {
      name: 'Mustering Push & Monitor',
      description: 'One drone pushes cattle forward, another monitors and maintains formation',
      mode: 'cattle',
      drones: [
        {
          role: 'pusher',
          droneId: '',
          behavior: 'Apply pressure from behind, move cattle towards goal point. Use low-stress techniques: approach slowly, maintain safe distance, release pressure when cattle move correctly.',
          parameters: { approachAngle: 45, pressureDistance: 30, releaseDistance: 50 },
        },
        {
          role: 'monitor',
          droneId: '',
          behavior: 'Fly around herd maintaining radius formation. Monitor stragglers, keep herd together, provide overwatch.',
          parameters: { orbitRadius: 100, altitude: 50, speed: 5 },
        },
      ],
    },
    {
      name: 'V-Formation Mustering',
      description: 'Two drones in V-formation guide cattle from sides',
      mode: 'cattle',
      drones: [
        {
          role: 'flanker',
          droneId: '',
          behavior: 'Position on left side of herd, guide cattle forward',
          parameters: { side: 'left', distance: 40, speed: 4 },
        },
        {
          role: 'flanker',
          droneId: '',
          behavior: 'Position on right side of herd, guide cattle forward',
          parameters: { side: 'right', distance: 40, speed: 4 },
        },
      ],
    },
  ],
  hunting: [
    {
      name: 'Track & Overwatch',
      description: 'One drone tracks game, another provides overwatch and scouting',
      mode: 'hunting',
      drones: [
        {
          role: 'tracker',
          droneId: '',
          behavior: 'Follow target animal, maintain safe distance, use motion camouflage techniques',
          parameters: { followDistance: 100, altitude: 30, stealthMode: true },
        },
        {
          role: 'overwatch',
          droneId: '',
          behavior: 'Fly higher altitude, scout ahead, identify terrain and obstacles',
          parameters: { altitude: 150, scanRadius: 500, speed: 8 },
        },
      ],
    },
    {
      name: 'Formation Tracking',
      description: 'Multiple drones in formation track and monitor wildlife',
      mode: 'hunting',
      drones: [
        {
          role: 'tracker',
          droneId: '',
          behavior: 'Primary tracker following target',
          parameters: { followDistance: 80, altitude: 40 },
        },
        {
          role: 'monitor',
          droneId: '',
          behavior: 'Secondary monitor, backup tracking',
          parameters: { orbitRadius: 200, altitude: 60 },
        },
      ],
    },
  ],
  filming: [
    {
      name: 'Multi-Angle Coverage',
      description: 'Multiple drones capture different angles simultaneously',
      mode: 'filming',
      drones: [
        {
          role: 'camera',
          droneId: '',
          behavior: 'Primary camera, follow subject closely',
          parameters: { followDistance: 20, altitude: 10, cameraAngle: 0 },
        },
        {
          role: 'camera',
          droneId: '',
          behavior: 'Secondary camera, wide angle coverage',
          parameters: { orbitRadius: 50, altitude: 30, cameraAngle: -15 },
        },
        {
          role: 'camera',
          droneId: '',
          behavior: 'Aerial view camera, high altitude',
          parameters: { altitude: 100, cameraAngle: -90 },
        },
      ],
    },
    {
      name: 'Dynamic Formation',
      description: 'Drones maintain formation while following moving subject',
      mode: 'filming',
      drones: [
        {
          role: 'camera',
          droneId: '',
          behavior: 'Lead camera, maintain formation',
          parameters: { position: 'front', distance: 30 },
        },
        {
          role: 'camera',
          droneId: '',
          behavior: 'Side camera, maintain formation',
          parameters: { position: 'side', distance: 40 },
        },
      ],
    },
  ],
  people: [
    {
      name: 'Perimeter Monitoring',
      description: 'Drones monitor perimeter and identify people',
      mode: 'people',
      drones: [
        {
          role: 'monitor',
          droneId: '',
          behavior: 'Patrol perimeter, identify and track people',
          parameters: { patrolRadius: 200, altitude: 50, speed: 5 },
        },
        {
          role: 'overwatch',
          droneId: '',
          behavior: 'High altitude overwatch, coordinate monitoring',
          parameters: { altitude: 150, scanRadius: 500 },
        },
      ],
    },
  ],
}

export default function AIDroneCommandInterface({
  mode,
  drones,
  onCommandExecuted,
}: AIDroneCommandInterfaceProps) {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [command, setCommand] = useState('')
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [pendingCommand, setPendingCommand] = useState<AIDroneCommand | null>(null)

  const handleNaturalLanguageCommand = async () => {
    if (!command.trim()) return

    setIsProcessing(true)
    try {
      // Send to AI for interpretation
      const response = await fetchWithAuth('/api/civilian/drone/ai-command', {
        method: 'POST',
        body: JSON.stringify({
          command,
          mode,
          availableDrones: drones.map((d) => d.id),
        }),
      }) as { command?: AIDroneCommand } | null

      if (response?.command) {
        setPendingCommand(response.command)
        setIsConfirming(true)
      } else {
        showError('Could not interpret command. Please try rephrasing.')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process command'
      logger.error('Failed to process AI command:', err)
      showError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePatternSelect = (pattern: CoordinationPattern) => {
    // Assign drones to pattern roles
    const assignedPattern = {
      ...pattern,
      drones: pattern.drones.map((d, idx) => ({
        ...d,
        droneId: drones[idx]?.id || '',
      })),
    }

    setPendingCommand({
      command: `Execute ${pattern.name}`,
      mode,
      drones: assignedPattern.drones.map((d) => d.droneId).filter(Boolean),
      parameters: {
        formation: pattern.name.toLowerCase().includes('formation') ? 'v' : 'circle',
        ...assignedPattern.drones[0]?.parameters,
      },
    })
    setSelectedPattern(pattern.name)
    setIsConfirming(true)
  }

  const confirmExecution = async () => {
    if (!pendingCommand) return

    setIsProcessing(true)
    try {
      await fetchWithAuth('/api/civilian/drone/execute-coordination', {
        method: 'POST',
        body: JSON.stringify(pendingCommand),
      })

      success('Drone coordination command executed successfully!')
      setCommand('')
      setPendingCommand(null)
      setIsConfirming(false)
      setSelectedPattern(null)
      if (onCommandExecuted) {
        onCommandExecuted()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute command'
      logger.error('Failed to execute coordination:', err)
      showError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const cancelCommand = () => {
    setPendingCommand(null)
    setIsConfirming(false)
    setSelectedPattern(null)
  }

  const availablePatterns = coordinationPatterns[mode] || []

  return (
    <div className="card-glass p-6">
      <h3 className="text-2xl font-bold text-white mb-6">AI Drone Command Interface</h3>

      {/* Natural Language Input */}
      <div className="mb-6">
        <label className="text-sm text-slate-300 mb-2 block">
          Describe what you want the drones to do:
        </label>
        <div className="flex gap-2">
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g., 'I want one drone to push the cattle towards the goal point, and one to monitor and fly around the herd keeping them in a certain radius formation'"
            className="flex-1 glass border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 min-h-[100px]"
            disabled={isProcessing}
          />
        </div>
        <button
          onClick={handleNaturalLanguageCommand}
          disabled={isProcessing || !command.trim()}
          className="btn-primary mt-2"
        >
          {isProcessing ? 'Processing...' : 'Process Command'}
        </button>
      </div>

      {/* Predefined Patterns */}
      {availablePatterns.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-4">Or Select a Predefined Pattern:</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {availablePatterns.map((pattern, idx) => (
              <div
                key={idx}
                className={`card-glass p-4 border cursor-pointer transition-all ${
                  selectedPattern === pattern.name
                    ? 'border-blue-500 ring-2 ring-blue-500/50'
                    : 'border-white/20 hover:border-blue-500/50'
                }`}
                onClick={() => handlePatternSelect(pattern)}
              >
                <h5 className="font-bold text-white mb-2">{pattern.name}</h5>
                <p className="text-sm text-slate-300 mb-3">{pattern.description}</p>
                <div className="space-y-2">
                  {pattern.drones.map((drone, dIdx) => (
                    <div key={dIdx} className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">{drone.role}:</span> {drone.behavior}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Command Confirmation */}
      {isConfirming && pendingCommand && (
        <div className="card-glass p-6 border border-blue-500/50 bg-blue-500/10">
          <h4 className="text-lg font-bold text-white mb-4">Confirm Command Execution</h4>
          <div className="mb-4">
            <p className="text-white font-semibold mb-2">Command:</p>
            <p className="text-slate-300 mb-4">{pendingCommand.command}</p>
            {pendingCommand.drones && pendingCommand.drones.length > 0 && (
              <div className="mb-4">
                <p className="text-white font-semibold mb-2">Drones:</p>
                <div className="flex flex-wrap gap-2">
                  {pendingCommand.drones.map((droneId) => {
                    const drone = drones.find((d) => d.id === droneId)
                    return (
                      <span
                        key={droneId}
                        className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-lg text-sm text-blue-300"
                      >
                        {drone?.name || droneId}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            {pendingCommand.parameters && (
              <div>
                <p className="text-white font-semibold mb-2">Parameters:</p>
                <pre className="text-xs text-slate-300 bg-black/40 rounded p-3 overflow-x-auto">
                  {JSON.stringify(pendingCommand.parameters, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={confirmExecution} disabled={isProcessing} className="btn-primary flex-1">
              {isProcessing ? 'Executing...' : 'Confirm & Execute'}
            </button>
            <button onClick={cancelCommand} disabled={isProcessing} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 glass border border-white/10 rounded-lg">
        <p className="text-sm text-slate-400">
          <strong className="text-slate-300">Tip:</strong> Describe your goal in natural language. The AI will
          interpret your command and coordinate multiple drones to achieve it. You can also select predefined
          patterns based on proven techniques from professional drone operations.
        </p>
      </div>
    </div>
  )
}
