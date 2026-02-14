'use client'

interface OperationOption {
  id: string
  title: string
  description: string
  icon: string
  requiresLocation?: boolean
  requiresDestination?: boolean
}

interface OperationOptionsProps {
  mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining' | null
  onSelect: (option: OperationOption) => void
  selectedOption?: string
}

const operationOptions: Record<string, OperationOption[]> = {
  cattle: [
    {
      id: 'mustering',
      title: 'Mustering to Location',
      description: 'Move livestock to a specific destination point',
      icon: '🐄',
      requiresLocation: true,
      requiresDestination: true
    },
    {
      id: 'recon',
      title: 'Reconnaissance Survey',
      description: 'Survey and locate all livestock in the area',
      icon: '🔍',
      requiresLocation: true
    },
    {
      id: 'health-check',
      title: 'Health Check',
      description: 'Monitor livestock health and identify issues',
      icon: '🏥',
      requiresLocation: true
    },
    {
      id: 'counting',
      title: 'Count & Inventory',
      description: 'Count and catalog all animals in the herd',
      icon: '📊',
      requiresLocation: true
    },
    {
      id: 'tracking',
      title: 'Track Missing Animals',
      description: 'Search for and track down missing livestock',
      icon: '🔎',
      requiresLocation: true
    },
    {
      id: 'fence-check',
      title: 'Fence Inspection',
      description: 'Check fence lines and identify breaches',
      icon: '🔧',
      requiresLocation: true
    }
  ],
  hunting: [
    {
      id: 'scout',
      title: 'Scout Game Location',
      description: 'Locate and identify game animals in the area',
      icon: '🦌',
      requiresLocation: true
    },
    {
      id: 'approach',
      title: 'Plan Approach Route',
      description: 'Calculate optimal approach path to target',
      icon: '🎯',
      requiresLocation: true,
      requiresDestination: true
    },
    {
      id: 'wind-check',
      title: 'Wind & Weather Check',
      description: 'Analyze wind patterns and weather conditions',
      icon: '💨',
      requiresLocation: true
    },
    {
      id: 'distance-estimate',
      title: 'Distance Estimation',
      description: 'Measure distance to target and calculate shot',
      icon: '📏',
      requiresLocation: true,
      requiresDestination: true
    },
    {
      id: 'terrain-analysis',
      title: 'Terrain Analysis',
      description: 'Analyze terrain for optimal positioning',
      icon: '🗺️',
      requiresLocation: true
    },
    {
      id: 'tracking',
      title: 'Track Wounded Game',
      description: 'Follow blood trail and locate wounded animal',
      icon: '🩸',
      requiresLocation: true
    }
  ],
  people: [
    {
      id: 'identification',
      title: 'Person Identification',
      description: 'Identify and verify person using facial recognition',
      icon: '👤',
      requiresLocation: true
    },
    {
      id: 'tracking',
      title: 'Track Movement',
      description: 'Follow and monitor person movement',
      icon: '📍',
      requiresLocation: true
    },
    {
      id: 'counting',
      title: 'Count People',
      description: 'Count and catalog people in an area',
      icon: '👥',
      requiresLocation: true
    },
    {
      id: 'security',
      title: 'Security Check',
      description: 'Monitor area for unauthorized personnel',
      icon: '🔒',
      requiresLocation: true
    },
    {
      id: 'event-monitoring',
      title: 'Event Monitoring',
      description: 'Monitor crowd at events or gatherings',
      icon: '🎉',
      requiresLocation: true
    }
  ],
  filming: [
    {
      id: 'follow-subject',
      title: 'Follow Subject',
      description: 'Automatically follow and film a moving subject',
      icon: '🎬',
      requiresLocation: true
    },
    {
      id: 'cinematic',
      title: 'Cinematic Shot',
      description: 'Create cinematic aerial shots with smooth movements',
      icon: '🎥',
      requiresLocation: true
    },
    {
      id: 'event-coverage',
      title: 'Event Coverage',
      description: 'Cover events with automated camera movements',
      icon: '📹',
      requiresLocation: true
    },
    {
      id: 'aerial-view',
      title: 'Aerial Overview',
      description: 'Capture wide aerial views of locations',
      icon: '✈️',
      requiresLocation: true
    },
    {
      id: 'orbit',
      title: 'Orbit Shot',
      description: 'Create circular orbit around subject',
      icon: '🔄',
      requiresLocation: true,
      requiresDestination: true
    },
    {
      id: 'reveal',
      title: 'Reveal Shot',
      description: 'Create dramatic reveal shots',
      icon: '🎭',
      requiresLocation: true,
      requiresDestination: true
    }
  ],
  fishing: [
    {
      id: 'autonomous-scout',
      title: 'Autonomous Fish Scout',
      description: 'AI-powered autonomous scouting that identifies fish, estimates size, and provides live advice',
      icon: '🤖',
      requiresLocation: true
    },
    {
      id: 'fish-scout',
      title: 'Scout Fish Schools',
      description: 'Locate and identify fish schools using aerial cameras and thermal imaging',
      icon: '🐟',
      requiresLocation: true
    },
    {
      id: 'bait-deploy',
      title: 'Precision Bait Deployment',
      description: 'Deploy bait to exact GPS coordinates with automated release mechanism',
      icon: '🪝',
      requiresLocation: true
    },
    {
      id: 'structure-map',
      title: 'Map Underwater Structures',
      description: 'Identify reefs, drop-offs, and underwater structures that attract fish',
      icon: '🗺️',
      requiresLocation: true
    },
    {
      id: 'water-quality',
      title: 'Water Quality Monitoring',
      description: 'Monitor temperature, clarity, and water conditions for optimal fishing',
      icon: '🌊',
      requiresLocation: true
    },
    {
      id: 'thermal-detection',
      title: 'Thermal Fish Detection',
      description: 'Use thermal imaging to detect fish activity in various water conditions',
      icon: '🔥',
      requiresLocation: true
    },
    {
      id: 'bait-drop-route',
      title: 'Multi-Point Bait Drop',
      description: 'Plan route for dropping bait at multiple strategic locations',
      icon: '📍',
      requiresLocation: true,
      requiresDestination: true
    },
    {
      id: 'fishing-zone',
      title: 'Define Fishing Zone',
      description: 'Mark and monitor a specific fishing zone with boundary waypoints',
      icon: '🎯',
      requiresLocation: true,
      requiresDestination: true
    },
    {
      id: 'line-release',
      title: 'Automated Line Release',
      description: 'Set up automated line release system for remote fishing operations',
      icon: '🎣',
      requiresLocation: true
    },
    {
      id: 'sonar-mapping',
      title: 'AI Sonar Mapping',
      description: 'Advanced sonar mapping with 41% improved fish detection accuracy using AI algorithms',
      icon: '📡',
      requiresLocation: true
    },
    {
      id: 'swarm-scout',
      title: 'Swarm Intelligence Scout',
      description: 'Deploy multiple drones working together to efficiently cover large areas',
      icon: '🐙',
      requiresLocation: true,
      requiresDestination: true
    },
    {
      id: 'hybrid-dive',
      title: 'Hybrid Aerial-Underwater',
      description: 'Deploy hybrid drone that can fly and dive underwater for comprehensive scouting',
      icon: '🌊',
      requiresLocation: true
    },
    {
      id: 'environmental-scan',
      title: 'Advanced Environmental Scan',
      description: 'Monitor pH, oxygen levels, turbidity, and water quality parameters',
      icon: '🔬',
      requiresLocation: true
    },
    {
      id: 'route-optimization',
      title: 'AI Route Optimization',
      description: 'AI-powered route planning that maximizes coverage and minimizes redundant passes',
      icon: '🗺️',
      requiresLocation: true,
      requiresDestination: true
    }
  ],
  mining: [
    {
      id: 'survey-grid',
      title: 'Pit & Stockpile Survey',
      description: 'Generate survey grid for pit, stockpile, or tailings; volumetric measurement',
      icon: '📐',
      requiresLocation: true,
      requiresDestination: true
    },
    {
      id: 'inspection',
      title: 'Infrastructure Inspection',
      description: 'Conveyors, crushers, highwalls, haul roads; scheduled inspection waypoints',
      icon: '🔧',
      requiresLocation: true
    },
    {
      id: 'safety-exclusion',
      title: 'Safety & Exclusion Zone',
      description: 'Blast exclusion, haul road crossings; people/vehicle awareness',
      icon: '⚠️',
      requiresLocation: true,
      requiresDestination: true
    },
    {
      id: 'environmental-rehab',
      title: 'Environmental & Rehab',
      description: 'Fauna monitoring, vegetation, erosion; rehab progress surveys',
      icon: '🌿',
      requiresLocation: true
    },
    {
      id: 'dust-monitoring',
      title: 'Dust & Visual Monitoring',
      description: 'Dust from haul roads, crushers, stockpiles; visual compliance',
      icon: '💨',
      requiresLocation: true
    },
    {
      id: 'incident-response',
      title: 'Incident Response',
      description: 'Quick deployment for search, vehicle rollover, medical emergency',
      icon: '🚨',
      requiresLocation: true,
      requiresDestination: true
    },
    {
      id: 'volume-estimate',
      title: 'Stockpile Volume Estimate',
      description: 'Estimate volume from survey data; export to mine planning',
      icon: '📊',
      requiresLocation: true
    }
  ]
}

export default function OperationOptions({ mode, onSelect, selectedOption }: OperationOptionsProps) {
  if (!mode) {
    return (
      <div className="card-jarvis p-8 text-center border-2 border-jarvis-emerald/20">
        <p className="text-jarvis-cyan/70 font-jarvis text-jarvis-high-contrast">Select a mode to see available operations</p>
      </div>
    )
  }

  const options = operationOptions[mode] || []

  return (
    <div className="card-jarvis p-6 sm:p-8 border-2 border-jarvis-emerald/20">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-jarvis-emerald/30 via-jarvis-cyan/20 to-jarvis-blue/30 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-jarvis-emerald/40 shadow-glow-jarvis relative">
          <div className="absolute inset-0 bg-jarvis-emerald/10 animate-jarvis-glow rounded-2xl"></div>
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-jarvis-emerald relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gradient-jarvis font-jarvis text-jarvis-high-contrast">Operation Type</h3>
          <p className="text-xs sm:text-sm text-jarvis-cyan/70 font-jarvis text-jarvis-high-contrast">Select what you want to accomplish</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(option) } }}
            aria-pressed={selectedOption === option.id}
            aria-label={`${option.title}. ${option.description}`}
            className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-500 text-left font-jarvis touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-dji-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
              selectedOption === option.id
                ? 'border-jarvis-emerald/60 bg-jarvis-emerald/20 shadow-glow-jarvis ring-2 ring-jarvis-emerald/30'
                : 'border-jarvis-emerald/20 glass-jarvis hover:border-jarvis-emerald/40 hover:scale-[1.02] hover:shadow-glow-jarvis'
            }`}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="text-3xl sm:text-4xl filter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{option.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base sm:text-lg text-gradient-jarvis mb-1 sm:mb-2 font-jarvis text-jarvis-high-contrast">{option.title}</h4>
                <p className="text-xs sm:text-sm text-jarvis-cyan/80 font-jarvis leading-relaxed text-jarvis-high-contrast">{option.description}</p>
                <div className="flex items-center gap-2 mt-2 sm:mt-3 flex-wrap">
                  {option.requiresLocation && (
                    <span className="text-xs px-2 sm:px-3 py-1 bg-jarvis-cyan/20 border border-jarvis-cyan/50 text-jarvis-cyan rounded-lg font-jarvis font-semibold">
                      Location
                    </span>
                  )}
                  {option.requiresDestination && (
                    <span className="text-xs px-2 sm:px-3 py-1 bg-jarvis-blue/20 border border-jarvis-blue/50 text-jarvis-blue rounded-lg font-jarvis font-semibold">
                      Destination
                    </span>
                  )}
                </div>
              </div>
              {selectedOption === option.id && (
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-jarvis-emerald rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
