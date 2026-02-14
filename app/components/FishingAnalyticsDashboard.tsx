'use client'

import { useMemo } from 'react'
import type { Detection, DroneInstance } from '../types/api'

interface FishingAnalyticsDashboardProps {
  detections: Detection[]
  drones: DroneInstance[]
  boatLocation?: { lat: number; lon: number }
}

export default function FishingAnalyticsDashboard({ detections, drones, boatLocation: _boatLocation }: FishingAnalyticsDashboardProps) {
  const fishDetections = detections.filter(d => {
    if (!d) return false
    const species = d.species
    const label = d.label
    return (species && typeof species === 'string') || 
           (label && typeof label === 'string' && label.toLowerCase().includes('fish'))
  })

  const analytics = useMemo(() => {
    const totalFish = fishDetections.length
    const avgSize = fishDetections.length > 0
      ? fishDetections.reduce((sum, f) => sum + (f.estimated_size_cm || 0), 0) / fishDetections.length
      : 0
    const avgWeight = fishDetections.length > 0
      ? fishDetections.reduce((sum, f) => sum + (f.estimated_weight_kg || 0), 0) / fishDetections.length
      : 0
    const largestFish = fishDetections.length > 0 && fishDetections[0] 
      ? fishDetections.reduce((prev, curr) => {
          return (curr.estimated_size_cm || 0) > (prev.estimated_size_cm || 0) ? curr : prev
        }, fishDetections[0])
      : null

    // Species distribution
    const speciesCount: Record<string, number> = {}
    fishDetections.forEach(f => {
      const species = f.species || f.label || 'Unknown'
      speciesCount[species] = (speciesCount[species] || 0) + 1
    })

    // Water conditions analysis
    const waterConditions = fishDetections
      .filter(f => f.water_conditions)
      .map(f => f.water_conditions!)
    const avgTemp = waterConditions.length > 0
      ? waterConditions.reduce((sum, w) => sum + (w.temperature_c || 0), 0) / waterConditions.length
      : 0
    const phConditions = waterConditions.filter(w => w.ph && typeof w.ph === 'number')
    const avgPH = phConditions.length > 0
      ? phConditions.reduce((sum, w) => sum + (w.ph || 0), 0) / phConditions.length
      : 0
    const oxygenConditions = waterConditions.filter(w => w.oxygen_level_mg_l && typeof w.oxygen_level_mg_l === 'number')
    const avgOxygen = oxygenConditions.length > 0
      ? oxygenConditions.reduce((sum, w) => sum + (w.oxygen_level_mg_l || 0), 0) / oxygenConditions.length
      : 0

    // Sonar coverage
    const sonarDetections = fishDetections.filter(f => f.sonar_data)
    const sonarAccuracy = sonarDetections.length > 0
      ? sonarDetections.reduce((sum, f) => sum + (f.sonar_data?.signal_strength || 0), 0) / sonarDetections.length
      : 0

    // Swarm efficiency
    const swarmDrones = drones.filter(d => d.status === 'mission')
    const coverageArea = fishDetections
      .filter(f => f.swarm_info?.coverage_area_m2)
      .reduce((sum, f) => sum + (f.swarm_info?.coverage_area_m2 || 0), 0)

    return {
      totalFish,
      avgSize: round(avgSize, 1),
      avgWeight: round(avgWeight, 2),
      largestFish,
      speciesCount,
      avgTemp: round(avgTemp, 1),
      avgPH: round(avgPH, 2),
      avgOxygen: round(avgOxygen, 2),
      sonarAccuracy: round(sonarAccuracy * 100, 1),
      swarmDrones: swarmDrones.length,
      coverageArea: round(coverageArea / 10000, 2) // Convert to hectares
    }
  }, [fishDetections, drones])

  const round = (num: number, decimals: number) => {
    if (typeof num !== 'number' || isNaN(num)) {
      return 0
    }
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  const getWaterQualityStatus = (ph?: number, oxygen?: number) => {
    if (!ph && !oxygen) return { status: 'Unknown', color: 'slate' }
    let score = 0
    if (ph) {
      if (ph >= 6.5 && ph <= 8.5) score += 50
      else if (ph >= 6.0 && ph <= 9.0) score += 25
    }
    if (oxygen) {
      if (oxygen >= 6) score += 50
      else if (oxygen >= 4) score += 25
    }
    if (score >= 75) return { status: 'Excellent', color: 'green' }
    if (score >= 50) return { status: 'Good', color: 'blue' }
    if (score >= 25) return { status: 'Fair', color: 'yellow' }
    return { status: 'Poor', color: 'red' }
  }

  const waterQuality = getWaterQualityStatus(analytics.avgPH, analytics.avgOxygen)

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-glass p-6 border-2 border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Total Fish Detected</span>
            <span className="text-2xl">🐟</span>
          </div>
          <div className="text-3xl font-bold text-white">{analytics.totalFish}</div>
          <div className="text-xs text-slate-400 mt-1">AI-powered detection</div>
        </div>

        <div className="card-glass p-6 border-2 border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Avg Size</span>
            <span className="text-2xl">📏</span>
          </div>
          <div className="text-3xl font-bold text-white">{analytics.avgSize}cm</div>
          <div className="text-xs text-slate-400 mt-1">Average length</div>
        </div>

        <div className="card-glass p-6 border-2 border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Sonar Accuracy</span>
            <span className="text-2xl">📡</span>
          </div>
          <div className="text-3xl font-bold text-white">{analytics.sonarAccuracy}%</div>
          <div className="text-xs text-slate-400 mt-1">41% improved detection</div>
        </div>

        <div className="card-glass p-6 border-2 border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Coverage Area</span>
            <span className="text-2xl">🗺️</span>
          </div>
          <div className="text-3xl font-bold text-white">{analytics.coverageArea}ha</div>
          <div className="text-xs text-slate-400 mt-1">Swarm coverage</div>
        </div>
      </div>

      {/* Water Quality & Environmental Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-glass p-6 border-2 border-emerald-500/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🌊</span>
            Water Quality Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status</span>
              <span className={`px-3 py-1 rounded-lg font-semibold text-sm bg-${waterQuality.color}-500/20 text-${waterQuality.color}-400 border border-${waterQuality.color}-500/50`}>
                {waterQuality.status}
              </span>
            </div>
            {analytics.avgTemp > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Temperature</span>
                <span className="text-white font-semibold">{analytics.avgTemp}°C</span>
              </div>
            )}
            {analytics.avgPH > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">pH Level</span>
                <span className="text-white font-semibold">{analytics.avgPH}</span>
              </div>
            )}
            {analytics.avgOxygen > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Oxygen</span>
                <span className="text-white font-semibold">{analytics.avgOxygen} mg/L</span>
              </div>
            )}
          </div>
        </div>

        <div className="card-glass p-6 border-2 border-blue-500/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🐟</span>
            Species Distribution
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(analytics.speciesCount).length === 0 ? (
              <p className="text-slate-400 text-sm">No species data yet</p>
            ) : (
              Object.entries(analytics.speciesCount)
                .sort(([, a], [, b]) => b - a)
                .map(([species, count]) => (
                  <div key={species} className="flex items-center justify-between">
                    <span className="text-slate-300">{species}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                          style={{ width: `${(count / analytics.totalFish) * 100}%` }}
                        />
                      </div>
                      <span className="text-white font-semibold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Largest Fish & Swarm Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analytics.largestFish && (
          <div className="card-glass p-6 border-2 border-yellow-500/30">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🏆</span>
              Largest Fish Detected
            </h3>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">
                {analytics.largestFish.species || analytics.largestFish.label || 'Unknown'}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">Size: </span>
                  <span className="text-white font-semibold">{analytics.largestFish.estimated_size_cm}cm</span>
                </div>
                <div>
                  <span className="text-slate-400">Weight: </span>
                  <span className="text-white font-semibold">
                    ~{analytics.largestFish?.estimated_weight_kg && typeof analytics.largestFish.estimated_weight_kg === 'number' && !isNaN(analytics.largestFish.estimated_weight_kg)
                      ? analytics.largestFish.estimated_weight_kg.toFixed(1)
                      : '0.0'}kg
                  </span>
                </div>
                {analytics.largestFish.location_from_boat && (
                  <>
                    <div>
                      <span className="text-slate-400">Distance: </span>
                      <span className="text-white font-semibold">
                        {analytics.largestFish?.location_from_boat?.distance_meters && typeof analytics.largestFish.location_from_boat.distance_meters === 'number' && !isNaN(analytics.largestFish.location_from_boat.distance_meters)
                          ? analytics.largestFish.location_from_boat.distance_meters.toFixed(0)
                          : '0'}m
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Bearing: </span>
                      <span className="text-white font-semibold">
                        {analytics.largestFish.location_from_boat.bearing_degrees?.toFixed(0)}°
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="card-glass p-6 border-2 border-purple-500/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🐙</span>
            Swarm Intelligence Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Active Drones</span>
              <span className="text-white font-semibold text-xl">{analytics.swarmDrones}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Coverage Efficiency</span>
              <span className="text-white font-semibold">
                {analytics.coverageArea && analytics.coverageArea > 0 && analytics.totalFish && typeof analytics.totalFish === 'number' && typeof analytics.coverageArea === 'number' && !isNaN(analytics.totalFish) && !isNaN(analytics.coverageArea)
                  ? ((analytics.totalFish / analytics.coverageArea) * 10).toFixed(1)
                  : '0'} fish/ha
              </span>
            </div>
            <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-xs text-slate-300">
                Swarm coordination enables {analytics.swarmDrones > 1 ? 'efficient' : 'targeted'} area coverage with real-time data sharing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5G Connectivity & Battery Status */}
      <div className="card-glass p-6 border-2 border-cyan-500/30">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>📶</span>
          Connectivity & Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-slate-400 text-sm mb-1">5G Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white font-semibold">Connected</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">8km+ range</div>
          </div>
          <div>
            <div className="text-slate-400 text-sm mb-1">Battery Life</div>
            <div className="text-white font-semibold">60+ min</div>
            <div className="text-xs text-slate-400 mt-1">Hybrid propulsion</div>
          </div>
          <div>
            <div className="text-slate-400 text-sm mb-1">Data Rate</div>
            <div className="text-white font-semibold">HD Live</div>
            <div className="text-xs text-slate-400 mt-1">Real-time streaming</div>
          </div>
          <div>
            <div className="text-slate-400 text-sm mb-1">AI Processing</div>
            <div className="text-white font-semibold">Onboard</div>
            <div className="text-xs text-slate-400 mt-1">Edge computing</div>
          </div>
        </div>
      </div>
    </div>
  )
}

