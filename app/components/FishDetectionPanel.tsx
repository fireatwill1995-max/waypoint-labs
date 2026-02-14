'use client'

import { useState, useEffect } from 'react'
import type { Detection } from '../types/api'

interface FishDetectionPanelProps {
  detections: Detection[]
  boatLocation?: { lat: number; lon: number }
  onNavigateToFish?: (detection: Detection) => void
}

export default function FishDetectionPanel({ detections, boatLocation: _boatLocation, onNavigateToFish }: FishDetectionPanelProps) {
  const [selectedFish, setSelectedFish] = useState<Detection | null>(null)
  const [liveAdvice, setLiveAdvice] = useState<string>('')

  // Filter fish detections
  const fishDetections = detections.filter(d => d.species || d.label?.toLowerCase().includes('fish'))

  // Generate live advice based on detections
  useEffect(() => {
    if (fishDetections.length === 0) {
      setLiveAdvice('No fish detected. Try adjusting altitude or moving to a different area.')
      return
    }

    const largestFish = fishDetections.length > 0 ? fishDetections.reduce((prev, curr) => {
      const prevSize = prev.estimated_size_cm || 0
      const currSize = curr.estimated_size_cm || 0
      return currSize > prevSize ? curr : prev
    }, fishDetections[0]!) : null

    const advice = []
    
    if (largestFish && largestFish.estimated_size_cm) {
      if (largestFish.estimated_size_cm > 50) {
        advice.push(`🎣 Large fish detected (${largestFish.estimated_size_cm}cm)! This is a prime target.`)
      } else if (largestFish.estimated_size_cm > 30) {
        advice.push(`🐟 Medium-sized fish (${largestFish.estimated_size_cm}cm) spotted. Good catch potential.`)
      } else {
        advice.push(`🐠 Small fish (${largestFish.estimated_size_cm}cm) detected. Consider moving to deeper water.`)
      }
    }

    if (largestFish && largestFish.location_from_boat) {
      const { bearing_degrees, distance_meters } = largestFish.location_from_boat
      if (bearing_degrees !== undefined && distance_meters !== undefined) {
        const direction = bearing_degrees < 45 || bearing_degrees > 315 ? 'North' :
                         bearing_degrees < 135 ? 'East' :
                         bearing_degrees < 225 ? 'South' : 'West'
        const safeDistance = typeof distance_meters === 'number' && !isNaN(distance_meters) ? distance_meters.toFixed(0) : '0'
        const safeBearing = typeof bearing_degrees === 'number' && !isNaN(bearing_degrees) ? bearing_degrees.toFixed(0) : '0'
        advice.push(`📍 Fish located ${safeDistance}m ${direction} of boat (${safeBearing}°).`)
      }
    }

    if (largestFish && largestFish.water_conditions?.temperature_c) {
      const temp = largestFish.water_conditions.temperature_c
      if (temp < 15) {
        advice.push('🌡️ Cold water detected. Fish may be less active. Try deeper areas.')
      } else if (temp > 25) {
        advice.push('🌡️ Warm water - fish should be active. Good fishing conditions!')
      }
    }

    // Enhanced water quality advice
    if (largestFish && largestFish.water_conditions?.ph) {
      const ph = largestFish.water_conditions.ph
      if (ph < 6.5 || ph > 8.5) {
        advice.push('⚠️ pH levels outside optimal range (6.5-8.5). Fish may be stressed.')
      }
    }

    if (largestFish && largestFish.water_conditions?.oxygen_level_mg_l) {
      const oxygen = largestFish.water_conditions.oxygen_level_mg_l
      if (oxygen < 4) {
        advice.push('⚠️ Low oxygen levels detected. Fish activity may be reduced.')
      } else if (oxygen >= 6) {
        advice.push('✅ Excellent oxygen levels. Prime fishing conditions!')
      }
    }

    // Sonar detection advice
    if (largestFish && largestFish.sonar_data) {
      if (largestFish.sonar_data.signal_strength && largestFish.sonar_data.signal_strength > 0.8) {
        advice.push('📡 Strong sonar signal detected. High confidence in fish location.')
      }
      if (largestFish.sonar_data.structure_detected) {
        advice.push('🗺️ Underwater structure detected nearby. Fish likely congregating here.')
      }
    }

    // Swarm intelligence advice
    const swarmDetections = fishDetections.filter(f => f.swarm_info)
    if (swarmDetections.length > 0) {
      const coverage = swarmDetections.reduce((sum, f) => sum + (f.swarm_info?.coverage_area_m2 || 0), 0)
      if (coverage > 10000) {
        const safeCoverage = typeof coverage === 'number' && !isNaN(coverage) && coverage > 0
          ? (coverage / 10000).toFixed(1)
          : '0.0'
        advice.push(`🐙 Swarm coverage: ${safeCoverage} hectares. Efficient area scanning.`)
      }
    }

    if (fishDetections.length > 5) {
      advice.push(`🎯 School of ${fishDetections.length} fish detected! High activity area.`)
    }

    setLiveAdvice(advice.join(' '))
  }, [fishDetections])

  const getFishIcon = (species?: string) => {
    if (!species) return '🐟'
    const lower = species.toLowerCase()
    if (typeof lower === 'string') {
      if (lower.includes('bass')) return '🐟'
      if (lower.includes('tuna')) return '🐟'
      if (lower.includes('salmon')) return '🐟'
      if (lower.includes('snapper')) return '🐟'
      if (lower.includes('mackerel')) return '🐟'
    }
    return '🐠'
  }

  const getSizeCategory = (sizeCm?: number) => {
    if (!sizeCm) return 'Unknown'
    if (sizeCm > 50) return 'Large'
    if (sizeCm > 30) return 'Medium'
    return 'Small'
  }

  return (
    <div className="card-glass p-6 border-2 border-blue-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Live Fish Detection</h3>
            <p className="text-sm text-slate-400">{fishDetections.length} fish detected</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
          <span className="text-green-400 font-semibold text-sm">AI ACTIVE</span>
        </div>
      </div>

      {/* Live Advice */}
      {liveAdvice && (
        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg animate-pulse">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1 8a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
            <p className="text-sm text-blue-200 leading-relaxed">{liveAdvice}</p>
          </div>
        </div>
      )}

      {/* Fish List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {fishDetections.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No fish detected yet</p>
            <p className="text-xs mt-2">AI is scanning the area...</p>
          </div>
        ) : (
          fishDetections.map((fish, idx) => (
            <div
              key={fish.id || idx}
              onClick={() => {
                setSelectedFish(fish)
                if (onNavigateToFish) onNavigateToFish(fish)
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedFish?.id === fish.id
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-slate-700 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-4xl">{getFishIcon(fish.species)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white text-lg">
                        {fish.species || fish.label || 'Unknown Fish'}
                      </h4>
                      {fish.confidence && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-semibold">
                          {Math.round(fish.confidence * 100)}% match
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {fish.estimated_size_cm && (
                        <div>
                          <span className="text-slate-400">Size: </span>
                          <span className="text-white font-semibold">
                            {fish.estimated_size_cm}cm ({getSizeCategory(fish.estimated_size_cm)})
                          </span>
                        </div>
                      )}
                      {fish.estimated_weight_kg && (
                        <div>
                          <span className="text-slate-400">Weight: </span>
                          <span className="text-white font-semibold">
                            ~{fish.estimated_weight_kg && typeof fish.estimated_weight_kg === 'number' && !isNaN(fish.estimated_weight_kg)
                              ? fish.estimated_weight_kg.toFixed(1)
                              : '0.0'}kg
                          </span>
                        </div>
                      )}
                      {fish.location_from_boat && (
                        <>
                          {fish.location_from_boat.distance_meters !== undefined && (
                            <div>
                              <span className="text-slate-400">Distance: </span>
                              <span className="text-white font-semibold">
                                {fish.location_from_boat?.distance_meters && typeof fish.location_from_boat.distance_meters === 'number' && !isNaN(fish.location_from_boat.distance_meters)
                                  ? fish.location_from_boat.distance_meters.toFixed(0)
                                  : '0'}m
                              </span>
                            </div>
                          )}
                          {fish.location_from_boat.bearing_degrees !== undefined && (
                            <div>
                              <span className="text-slate-400">Bearing: </span>
                              <span className="text-white font-semibold">
                                {fish.location_from_boat?.bearing_degrees && typeof fish.location_from_boat.bearing_degrees === 'number' && !isNaN(fish.location_from_boat.bearing_degrees)
                                  ? fish.location_from_boat.bearing_degrees.toFixed(0)
                                  : '0'}°
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {fish.water_conditions?.depth_m && (
                        <div>
                          <span className="text-slate-400">Depth: </span>
                          <span className="text-white font-semibold">
                            {fish.water_conditions?.depth_m && typeof fish.water_conditions.depth_m === 'number' && !isNaN(fish.water_conditions.depth_m)
                              ? fish.water_conditions.depth_m.toFixed(1)
                              : '0.0'}m
                          </span>
                        </div>
                      )}
                      {fish.water_conditions?.ph && (
                        <div>
                          <span className="text-slate-400">pH: </span>
                          <span className="text-white font-semibold">
                            {fish.water_conditions?.ph && typeof fish.water_conditions.ph === 'number' && !isNaN(fish.water_conditions.ph)
                              ? fish.water_conditions.ph.toFixed(2)
                              : '0.00'}
                          </span>
                        </div>
                      )}
                      {fish.water_conditions?.oxygen_level_mg_l && (
                        <div>
                          <span className="text-slate-400">O₂: </span>
                          <span className="text-white font-semibold">
                            {fish.water_conditions?.oxygen_level_mg_l && typeof fish.water_conditions.oxygen_level_mg_l === 'number' && !isNaN(fish.water_conditions.oxygen_level_mg_l)
                              ? fish.water_conditions.oxygen_level_mg_l.toFixed(1)
                              : '0.0'} mg/L
                          </span>
                        </div>
                      )}
                      {fish.sonar_data?.signal_strength && (
                        <div>
                          <span className="text-slate-400">Sonar: </span>
                          <span className="text-white font-semibold">
                            {Math.round(fish.sonar_data.signal_strength * 100)}%
                          </span>
                        </div>
                      )}
                      {fish.swarm_info?.role && (
                        <div>
                          <span className="text-slate-400">Role: </span>
                          <span className="text-white font-semibold capitalize">
                            {fish.swarm_info?.role ? String(fish.swarm_info.role).replace(/-/g, ' ') : 'Unknown'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {onNavigateToFish && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigateToFish(fish)
                    }}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                  >
                    Navigate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

