'use client'

interface AutonomousMode {
  id: string
  name: string
  description: string
  icon: string
  autonomyLevel: number // 0-100
}

interface AutonomousModeSelectorProps {
  mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining' | null
  selectedMode?: string
  onSelect: (mode: AutonomousMode) => void
}

const autonomousModes: Record<string, AutonomousMode[]> = {
  cattle: [
    {
      id: 'manual',
      name: 'Manual Control',
      description: 'Full manual control - you control every movement',
      icon: '🎮',
      autonomyLevel: 0
    },
    {
      id: 'semi-auto-track',
      name: 'Semi-Auto Tracking',
      description: 'AI tracks animals, you control positioning',
      icon: '🎯',
      autonomyLevel: 40
    },
    {
      id: 'auto-follow',
      name: 'Auto Follow',
      description: 'Automatically follow herd movement',
      icon: '👥',
      autonomyLevel: 70
    },
    {
      id: 'full-auto',
      name: 'Full Autonomous',
      description: 'AI handles all navigation and tracking',
      icon: '🤖',
      autonomyLevel: 100
    }
  ],
  hunting: [
    {
      id: 'manual',
      name: 'Manual Control',
      description: 'Full manual control for precision',
      icon: '🎮',
      autonomyLevel: 0
    },
    {
      id: 'semi-auto-scout',
      name: 'Semi-Auto Scout',
      description: 'AI scouts area, you control approach',
      icon: '🔍',
      autonomyLevel: 30
    },
    {
      id: 'auto-track',
      name: 'Auto Track Target',
      description: 'Automatically track identified game',
      icon: '🦌',
      autonomyLevel: 60
    },
    {
      id: 'full-auto',
      name: 'Full Autonomous',
      description: 'AI handles scouting and tracking',
      icon: '🤖',
      autonomyLevel: 90
    }
  ],
  people: [
    {
      id: 'manual',
      name: 'Manual Control',
      description: 'Full manual control',
      icon: '🎮',
      autonomyLevel: 0
    },
    {
      id: 'semi-auto-identify',
      name: 'Semi-Auto Identify',
      description: 'AI identifies, you control tracking',
      icon: '👤',
      autonomyLevel: 50
    },
    {
      id: 'auto-follow',
      name: 'Auto Follow Person',
      description: 'Automatically follow identified person',
      icon: '📍',
      autonomyLevel: 80
    },
    {
      id: 'full-auto',
      name: 'Full Autonomous',
      description: 'AI handles all identification and tracking',
      icon: '🤖',
      autonomyLevel: 95
    }
  ],
  filming: [
    {
      id: 'manual',
      name: 'Manual Control',
      description: 'Full manual camera control',
      icon: '🎮',
      autonomyLevel: 0
    },
    {
      id: 'semi-auto-framing',
      name: 'Semi-Auto Framing',
      description: 'AI suggests framing, you control movement',
      icon: '📷',
      autonomyLevel: 40
    },
    {
      id: 'auto-follow',
      name: 'Auto Follow Subject',
      description: 'Automatically follow and frame subject',
      icon: '🎬',
      autonomyLevel: 75
    },
    {
      id: 'full-auto',
      name: 'Full Autonomous',
      description: 'AI handles all filming decisions',
      icon: '🤖',
      autonomyLevel: 90
    }
  ],
  fishing: [
    { id: 'manual', name: 'Manual Control', description: 'Full manual control', icon: '🎮', autonomyLevel: 0 },
    { id: 'semi-auto-scout', name: 'Semi-Auto Scout', description: 'AI scouts, you control', icon: '🔍', autonomyLevel: 40 },
    { id: 'auto-follow', name: 'Auto Follow School', description: 'Track fish schools', icon: '🐟', autonomyLevel: 70 },
    { id: 'full-auto', name: 'Full Autonomous', description: 'AI handles scouting', icon: '🤖', autonomyLevel: 85 }
  ],
  mining: [
    { id: 'manual', name: 'Manual Control', description: 'Full manual survey/inspection', icon: '🎮', autonomyLevel: 0 },
    { id: 'semi-auto-grid', name: 'Semi-Auto Survey Grid', description: 'AI suggests grid, you confirm', icon: '📐', autonomyLevel: 40 },
    { id: 'auto-inspect', name: 'Auto Inspection Route', description: 'Follow predefined inspection waypoints', icon: '🔧', autonomyLevel: 70 },
    { id: 'full-auto', name: 'Full Autonomous', description: 'AI runs survey/inspection mission', icon: '🤖', autonomyLevel: 90 }
  ]
}

export default function AutonomousModeSelector({ mode, selectedMode, onSelect }: AutonomousModeSelectorProps) {
  if (!mode) {
    return (
      <div className="card-glass p-8 text-center">
        <p className="text-slate-400">Select a mode to see autonomous options</p>
      </div>
    )
  }

  const modes = autonomousModes[mode] || []

  return (
    <div className="card-glass p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Autonomy Level</h3>
          <p className="text-sm text-slate-400">Choose how much control AI has</p>
        </div>
      </div>

      <div className="space-y-3">
        {modes.map((autonomousMode) => (
          <button
            key={autonomousMode.id}
            onClick={() => onSelect(autonomousMode)}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
              selectedMode === autonomousMode.id
                ? 'border-purple-500 bg-purple-500/20 shadow-glow'
                : 'border-white/20 glass hover:border-purple-500/50 hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">{autonomousMode.icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white">{autonomousMode.name}</h4>
                    {selectedMode === autonomousMode.id && (
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{autonomousMode.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-1">Autonomy</div>
                  <div className="text-sm font-bold text-white">{autonomousMode.autonomyLevel}%</div>
                </div>
                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${autonomousMode.autonomyLevel}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
