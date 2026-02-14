'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface Waypoint {
  lat: number
  lon: number
  altitude: number
  heading: number | null
  speed: number | null
  action: string | null
}

interface MissionPattern {
  type: string
  waypoints: Waypoint[]
  total_distance: number
  estimated_duration: number
}

export default function MissionPatternGenerator() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [patternType, setPatternType] = useState<'grid' | 'circular' | 'lawnmower' | 'spiral' | 'zigzag' | 'terrain_follow'>('grid')
  const [bounds, setBounds] = useState({ minLat: '', minLon: '', maxLat: '', maxLon: '' })
  const [altitude, setAltitude] = useState('100')
  const [overlap, setOverlap] = useState('0.7')
  const [isGenerating, setIsGenerating] = useState(false)
  const [pattern, setPattern] = useState<MissionPattern | null>(null)
  const [advancedOptions, setAdvancedOptions] = useState({
    terrain_following: false,
    gps_denied: false,
    obstacle_avoidance: true,
    adaptive_altitude: false,
    min_altitude: '10',
    max_altitude: '500',
    speed: '5',
    heading_mode: 'auto' as 'auto' | 'fixed' | 'relative',
  })

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      interface PatternPayload {
        pattern_type: 'grid' | 'circular' | 'lawnmower' | 'spiral' | 'zigzag' | 'terrain_follow'
        bounds: [number, number, number, number]
        altitude: number
        overlap: number
        center?: [number, number]
        radius?: number
        num_orbits?: number
        advanced_options?: {
          terrain_following: boolean
          gps_denied: boolean
          obstacle_avoidance: boolean
          adaptive_altitude: boolean
          min_altitude: string
          max_altitude: string
          speed: string
          heading_mode: 'auto' | 'fixed' | 'relative'
        }
      }

      // Validate inputs
      const minLat = parseFloat(bounds.minLat)
      const minLon = parseFloat(bounds.minLon)
      const maxLat = parseFloat(bounds.maxLat)
      const maxLon = parseFloat(bounds.maxLon)
      const alt = parseFloat(altitude)
      const ovl = parseFloat(overlap)

      // Validate coordinate ranges
      if (isNaN(minLat) || isNaN(minLon) || isNaN(maxLat) || isNaN(maxLon) || 
          isNaN(alt) || isNaN(ovl) || 
          minLat < -90 || minLat > 90 || minLon < -180 || minLon > 180 ||
          maxLat < -90 || maxLat > 90 || maxLon < -180 || maxLon > 180 ||
          minLat >= maxLat || minLon >= maxLon ||
          alt <= 0 || alt > 20000 || ovl < 0 || ovl > 1) {
        showError('Please enter valid bounds (lat: -90 to 90, lon: -180 to 180), altitude (0-20000m), and overlap (0-1)')
        setIsGenerating(false)
        return
      }

      const payload: PatternPayload = {
        pattern_type: patternType,
        bounds: [minLat, minLon, maxLat, maxLon],
        altitude: alt,
        overlap: ovl,
        advanced_options: advancedOptions,
      }

      if (patternType === 'circular') {
        payload.center = [
          (minLat + maxLat) / 2,
          (minLon + maxLon) / 2
        ]
        payload.radius = 50.0
        payload.num_orbits = 3
      }

      const response = await fetchWithAuth('/api/mission/pattern/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      }) as { pattern: MissionPattern }

      setPattern(response.pattern)
      success('Mission pattern generated successfully!')
    } catch (err) {
      logger.error('Pattern generation error:', err)
      showError('Failed to generate pattern')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="card-dji p-6 border-2 border-dji-500/20 rounded-xl">
      <h2 className="text-xl font-bold mb-4 font-futuristic text-slate-100">Mission Pattern Generator</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 font-futuristic text-slate-300">Pattern Type</label>
          <select
            value={patternType}
            onChange={(e) => setPatternType(e.target.value as 'grid' | 'circular' | 'lawnmower' | 'spiral' | 'zigzag' | 'terrain_follow')}
            className="input-dji w-full rounded-xl font-futuristic"
            aria-label="Select mission pattern type"
          >
            <option value="grid">Grid Survey</option>
            <option value="circular">Circular/Orbit</option>
            <option value="lawnmower">Lawnmower Pattern</option>
            <option value="spiral">Spiral Pattern</option>
            <option value="zigzag">Zigzag Pattern</option>
            <option value="terrain_follow">Terrain Following</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 font-futuristic text-slate-300">Min Latitude</label>
            <input
              type="number"
              value={bounds.minLat}
              onChange={(e) => setBounds({ ...bounds, minLat: e.target.value })}
              className="input-dji w-full rounded-xl font-futuristic"
              step="0.000001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 font-futuristic text-slate-300">Min Longitude</label>
            <input
              type="number"
              value={bounds.minLon}
              onChange={(e) => setBounds({ ...bounds, minLon: e.target.value })}
              className="input-dji w-full rounded-xl font-futuristic"
              step="0.000001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 font-futuristic text-slate-300">Max Latitude</label>
            <input
              type="number"
              value={bounds.maxLat}
              onChange={(e) => setBounds({ ...bounds, maxLat: e.target.value })}
              className="input-dji w-full rounded-xl font-futuristic"
              step="0.000001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 font-futuristic text-slate-300">Max Longitude</label>
            <input
              type="number"
              value={bounds.maxLon}
              onChange={(e) => setBounds({ ...bounds, maxLon: e.target.value })}
              className="input-dji w-full rounded-xl font-futuristic"
              step="0.000001"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 font-futuristic text-slate-300">
              {advancedOptions.terrain_following ? 'Base Altitude (m)' : 'Altitude (m)'}
            </label>
            <input
              type="number"
              value={altitude}
              onChange={(e) => setAltitude(e.target.value)}
              className="input-dji w-full rounded-xl font-futuristic"
              min="10"
              max="500"
            />
          </div>
          {(patternType === 'grid' || patternType === 'lawnmower') && (
            <div>
              <label className="block text-sm font-medium mb-2 font-futuristic text-slate-300">Overlap (0-1)</label>
              <input
                type="number"
                value={overlap}
                onChange={(e) => setOverlap(e.target.value)}
                className="input-dji w-full rounded-xl font-futuristic"
                min="0"
                max="1"
                step="0.1"
              />
            </div>
          )}
          {patternType !== 'grid' && patternType !== 'lawnmower' && (
            <div>
              <label className="block text-sm font-medium mb-2 font-futuristic text-slate-300">Speed (m/s)</label>
              <input
                type="number"
                value={advancedOptions.speed}
                onChange={(e) => setAdvancedOptions({ ...advancedOptions, speed: e.target.value })}
                className="input-dji w-full rounded-xl font-futuristic"
                min="1"
                max="20"
                step="0.5"
              />
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div className="p-4 glass-dji rounded-xl border border-dji-500/20">
          <h4 className="font-semibold mb-3 font-futuristic text-slate-100">Advanced Options</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="terrain_following"
                checked={advancedOptions.terrain_following}
                onChange={(e) =>
                  setAdvancedOptions({ ...advancedOptions, terrain_following: e.target.checked })
                }
                className="w-5 h-5 rounded border-dji-500/50 bg-slate-800 text-dji-500 focus:ring-dji-500"
                aria-label="Terrain following"
              />
              <label htmlFor="terrain_following" className="text-sm text-slate-300 cursor-pointer font-futuristic">
                Terrain Following (maintain constant height above ground)
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="gps_denied"
                checked={advancedOptions.gps_denied}
                onChange={(e) =>
                  setAdvancedOptions({ ...advancedOptions, gps_denied: e.target.checked })
                }
                className="w-5 h-5 rounded border-dji-500/50 bg-slate-800 text-dji-500 focus:ring-dji-500"
              />
              <label htmlFor="gps_denied" className="text-sm text-slate-300 cursor-pointer font-futuristic">
                GPS-Denied Navigation (use visual odometry/SLAM)
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="obstacle_avoidance"
                checked={advancedOptions.obstacle_avoidance}
                onChange={(e) =>
                  setAdvancedOptions({ ...advancedOptions, obstacle_avoidance: e.target.checked })
                }
                className="w-5 h-5 rounded border-dji-500/50 bg-slate-800 text-dji-500 focus:ring-dji-500"
              />
              <label htmlFor="obstacle_avoidance" className="text-sm text-slate-300 cursor-pointer font-futuristic">
                Obstacle Avoidance
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="adaptive_altitude"
                checked={advancedOptions.adaptive_altitude}
                onChange={(e) =>
                  setAdvancedOptions({ ...advancedOptions, adaptive_altitude: e.target.checked })
                }
                className="w-5 h-5 rounded border-dji-500/50 bg-slate-800 text-dji-500 focus:ring-dji-500"
              />
              <label htmlFor="adaptive_altitude" className="text-sm text-slate-300 cursor-pointer font-futuristic">
                Adaptive Altitude (adjust based on terrain)
              </label>
            </div>
            {advancedOptions.adaptive_altitude && (
              <div className="grid grid-cols-2 gap-4 ml-8">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-futuristic">Min Altitude (m)</label>
                  <input
                    type="number"
                    value={advancedOptions.min_altitude}
                    onChange={(e) =>
                      setAdvancedOptions({ ...advancedOptions, min_altitude: e.target.value })
                    }
                    className="input-dji w-full rounded-lg text-sm font-futuristic"
                    min="5"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-futuristic">Max Altitude (m)</label>
                  <input
                    type="number"
                    value={advancedOptions.max_altitude}
                    onChange={(e) =>
                      setAdvancedOptions({ ...advancedOptions, max_altitude: e.target.value })
                    }
                    className="input-dji w-full rounded-lg text-sm font-futuristic"
                    min="50"
                    max="500"
                  />
                </div>
              </div>
            )}
            <div className="ml-8">
              <label className="block text-xs text-slate-400 mb-1 font-futuristic">Heading Mode</label>
              <select
                value={advancedOptions.heading_mode}
                onChange={(e) =>
                  setAdvancedOptions({
                    ...advancedOptions,
                    heading_mode: e.target.value as 'auto' | 'fixed' | 'relative',
                  })
                }
                className="input-dji w-full rounded-lg text-sm font-futuristic"
              >
                <option value="auto">Auto (follow path)</option>
                <option value="fixed">Fixed Heading</option>
                <option value="relative">Relative to Wind</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="btn-dji w-full px-4 py-3 rounded-xl font-futuristic font-semibold disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
          aria-busy={isGenerating}
          aria-label={isGenerating ? 'Generating pattern' : 'Generate mission pattern'}
        >
          {isGenerating ? 'Generating...' : 'Generate Pattern'}
        </button>

        {pattern && (
          <div className="mt-6 p-4 glass-dji rounded-xl border border-dji-500/20">
            <h3 className="font-semibold mb-3 font-futuristic text-slate-100">Generated Pattern</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4 font-futuristic">
              <div>
                <span className="text-slate-400">Waypoints:</span>
                <span className="ml-2 font-semibold text-slate-100">{pattern.waypoints.length}</span>
              </div>
              <div>
                <span className="text-slate-400">Total Distance:</span>
                <span className="ml-2 font-semibold text-slate-100">{(pattern.total_distance / 1000).toFixed(2)} km</span>
              </div>
              <div>
                <span className="text-slate-400">Est. Duration:</span>
                <span className="ml-2 font-semibold text-slate-100">{(pattern.estimated_duration / 60).toFixed(1)} min</span>
              </div>
              <div>
                <span className="text-slate-400">Pattern Type:</span>
                <span className="ml-2 font-semibold text-slate-100">{pattern.type}</span>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <div className="text-xs text-slate-400 space-y-1 font-futuristic">
                {pattern.waypoints.slice(0, 10).map((wp, i) => (
                  <div key={i}>
                    WP {i + 1}: {wp.lat.toFixed(6)}, {wp.lon.toFixed(6)} @ {wp.altitude}m
                  </div>
                ))}
                {pattern.waypoints.length > 10 && (
                  <div className="text-slate-500">... and {pattern.waypoints.length - 10} more waypoints</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

