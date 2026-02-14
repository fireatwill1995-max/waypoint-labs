'use client'

import { useMemo, useState, useCallback } from 'react'
import { logger } from '../lib/logger'

interface Waypoint {
  id: string
  lat: number
  lon: number
  alt: number
  name?: string
}

interface ManualControlPanelProps {
  waypoints?: Waypoint[]
  onWaypointsChange?: (waypoints: Waypoint[]) => void
  onExecute?: () => void
}

function webMercatorToLat(yNorm: number) {
  const merc = Math.PI * (1 - 2 * yNorm)
  return (180 / Math.PI) * Math.atan(Math.sinh(merc))
}

function addWaypointFromClick(
  event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  waypoints: Waypoint[],
  onWaypointsChange: (wps: Waypoint[]) => void,
  defaultAlt: number
) {
  try {
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) {
      return // Invalid rect
    }
    
    const xNorm = (event.clientX - rect.left) / rect.width
    const yNorm = (event.clientY - rect.top) / rect.height
    
    // Validate normalized coordinates
    if (xNorm < 0 || xNorm > 1 || yNorm < 0 || yNorm > 1) {
      return
    }
    
    const lon = xNorm * 360 - 180
    const lat = webMercatorToLat(yNorm)
    
    // Validate calculated coordinates
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return
    }
    
    const safeWaypoints = Array.isArray(waypoints) ? waypoints : []
    const wp: Waypoint = {
      id: Date.now().toString(),
      lat,
      lon,
      alt: defaultAlt,
      name: `Waypoint ${safeWaypoints.length + 1}`,
    }
    onWaypointsChange([...safeWaypoints, wp])
  } catch (error) {
    logger.error('Error adding waypoint from click:', error)
  }
}

export default function ManualControlPanel({ waypoints = [], onWaypointsChange, onExecute }: ManualControlPanelProps) {
  const [newWaypoint, setNewWaypoint] = useState({ lat: '', lon: '', alt: '100', name: '' })
  const defaultAlt = useMemo(() => {
    const parsed = parseFloat(newWaypoint.alt)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 100
  }, [newWaypoint.alt])
  
  // Ensure waypoints is always an array
  const safeWaypoints = Array.isArray(waypoints) ? waypoints : []

  const addWaypoint = () => {
    const lat = parseFloat(newWaypoint.lat)
    const lon = parseFloat(newWaypoint.lon)
    const alt = parseFloat(newWaypoint.alt)

    if (!isNaN(lat) && !isNaN(lon) && !isNaN(alt)) {
    const wp: Waypoint = {
      id: Date.now().toString(),
      lat,
      lon,
      alt,
      name: newWaypoint.name || `Waypoint ${safeWaypoints.length + 1}`,
    }
    if (onWaypointsChange) {
      onWaypointsChange([...safeWaypoints, wp])
    }
    setNewWaypoint({ lat: '', lon: '', alt: '100', name: '' })
    }
  }

  const removeWaypoint = (id: string) => {
    if (onWaypointsChange) {
      onWaypointsChange(safeWaypoints.filter((wp) => wp.id !== id))
    }
  }

  const clearAll = useCallback(() => {
    // Use window.confirm with proper error handling
    try {
      if (typeof window !== 'undefined' && window.confirm('Clear all waypoints?')) {
        if (onWaypointsChange) {
          onWaypointsChange([])
        }
      }
    } catch (error) {
      // If confirm fails (e.g., in test environment), just clear
      logger.warn('Confirm dialog failed, clearing waypoints anyway:', error)
      if (onWaypointsChange) {
        onWaypointsChange([])
      }
    }
  }, [onWaypointsChange])

  return (
    <div className="card-dji p-6 border-2 border-dji-500/20 rounded-xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-dji-500 to-dji-600 rounded-xl flex items-center justify-center border border-dji-400/40">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100 font-futuristic">Manual Control</h3>
            <p className="text-sm text-slate-400 font-futuristic">Create and manage waypoints manually</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="btn-danger text-sm min-h-[44px] px-4 rounded-xl font-futuristic touch-manipulation"
          disabled={safeWaypoints.length === 0}
          aria-label="Clear all waypoints"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="group" aria-label="Add waypoint coordinates">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={newWaypoint.lat}
            onChange={(e) => setNewWaypoint({ ...newWaypoint, lat: e.target.value })}
            className="input-dji rounded-xl text-sm font-futuristic"
            aria-label="Latitude"
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={newWaypoint.lon}
            onChange={(e) => setNewWaypoint({ ...newWaypoint, lon: e.target.value })}
            className="input-dji rounded-xl text-sm font-futuristic"
            aria-label="Longitude"
          />
          <input
            type="number"
            placeholder="Altitude (m)"
            value={newWaypoint.alt}
            onChange={(e) => setNewWaypoint({ ...newWaypoint, alt: e.target.value })}
            className="input-dji rounded-xl text-sm font-futuristic"
            aria-label="Altitude in meters"
          />
          <button
            type="button"
            onClick={addWaypoint}
            className="btn-dji text-sm min-h-[44px] rounded-xl font-futuristic disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!newWaypoint.lat || !newWaypoint.lon}
            aria-label="Add waypoint"
          >
            Add Waypoint
          </button>
        </div>

        {/* Quick map picker */}
        <div className="glass-dji border border-dji-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="font-semibold text-slate-100 font-futuristic">Map quick-add</div>
              <div className="text-xs text-slate-400 font-futuristic">
                Click anywhere on the map to drop a waypoint. Altitude uses the value above.
              </div>
            </div>
            <div className="text-xs text-slate-500 font-futuristic">Approximate, not GPS-locked</div>
          </div>
          <div
            className="rounded-xl border border-dji-500/20 overflow-hidden cursor-crosshair focus:outline-none focus-visible:ring-2 focus-visible:ring-dji-500"
            style={{
              height: 240,
              backgroundImage: "url('https://tile.openstreetmap.org/1/0/0.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onClick={(e) => addWaypointFromClick(e, safeWaypoints, onWaypointsChange || (() => {}), defaultAlt)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click() }}
            role="button"
            tabIndex={0}
            title="Click to add waypoint"
            aria-label="Click map to add waypoint at that position"
          />
        </div>

        {safeWaypoints.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto" role="list" aria-label="Waypoint list">
            {safeWaypoints.map((wp, idx) => (
              <div key={wp.id} className="glass-dji border border-dji-500/20 rounded-xl p-3 flex items-center justify-between" role="listitem">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-dji-500/20 border border-dji-500/50 rounded-lg flex items-center justify-center text-dji-400 font-bold text-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-100 font-futuristic truncate">{wp.name}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {wp.lat.toFixed(6)}, {wp.lon.toFixed(6)}, {wp.alt}m
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeWaypoint(wp.id)}
                  className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  aria-label={`Remove waypoint ${idx + 1}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onExecute}
          className="btn-dji w-full min-h-[44px] rounded-xl font-futuristic"
          disabled={safeWaypoints.length === 0 || !onExecute}
          aria-label={`Execute mission with ${safeWaypoints.length} waypoints`}
        >
          Execute Mission ({safeWaypoints.length} waypoints)
        </button>
      </div>
    </div>
  )
}
