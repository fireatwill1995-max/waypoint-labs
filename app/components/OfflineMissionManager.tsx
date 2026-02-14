'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface CachedMission {
  mission_id: string
  cached_at: string
  synced: boolean
}

export default function OfflineMissionManager() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [missionId, setMissionId] = useState('')
  const [waypoints, setWaypoints] = useState<Array<{ lat: number; lon: number; altitude: number }>>([])
  const [isCaching, setIsCaching] = useState(false)
  const [cachedMissions, setCachedMissions] = useState<CachedMission[]>([])

  const handleCacheMission = async () => {
    if (!missionId.trim() || waypoints.length === 0) {
      showError('Please enter mission ID and waypoints')
      return
    }

    setIsCaching(true)
    try {
      const response = await fetchWithAuth('/api/offline/cache-mission', {
        method: 'POST',
        body: JSON.stringify({
          mission_id: String(missionId || '').trim().slice(0, 100),
          waypoints: waypoints.map(wp => ({
            lat: typeof wp.lat === 'number' && !isNaN(wp.lat) && wp.lat >= -90 && wp.lat <= 90 ? wp.lat : 0,
            lon: typeof wp.lon === 'number' && !isNaN(wp.lon) && wp.lon >= -180 && wp.lon <= 180 ? wp.lon : 0,
            altitude: typeof wp.altitude === 'number' && !isNaN(wp.altitude) && wp.altitude >= -500 && wp.altitude <= 20000 ? wp.altitude : 100
          }))
        })
      }) as { mission: CachedMission }

      setCachedMissions([...cachedMissions, response.mission])
      success('Mission cached for offline use!')
      setMissionId('')
      setWaypoints([])
    } catch (err) {
      logger.error('Offline caching error:', err)
      showError('Failed to cache mission')
    } finally {
      setIsCaching(false)
    }
  }

  const addWaypoint = () => {
    setWaypoints([...waypoints, { lat: 0, lon: 0, altitude: 100 }])
  }

  const updateWaypoint = (index: number, field: string, value: number) => {
    const updated = [...waypoints]
    const waypoint = updated[index]
    if (waypoint) {
      updated[index] = { ...waypoint, [field]: value }
      setWaypoints(updated)
    }
  }

  return (
    <div className="card-glass p-6">
      <h2 className="text-2xl font-bold mb-4">Offline Mission Manager</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Mission ID</label>
          <input
            type="text"
            value={missionId}
            onChange={(e) => setMissionId(e.target.value)}
            placeholder="Enter mission ID"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Waypoints</label>
            <button
              onClick={addWaypoint}
              className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
            >
              + Add Waypoint
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {waypoints.map((wp, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 p-2 bg-gray-800/50 rounded">
                <input
                  type="number"
                  value={wp.lat}
                  onChange={(e) => updateWaypoint(i, 'lat', parseFloat(e.target.value) || 0)}
                  placeholder="Lat"
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  step="0.000001"
                />
                <input
                  type="number"
                  value={wp.lon}
                  onChange={(e) => updateWaypoint(i, 'lon', parseFloat(e.target.value) || 0)}
                  placeholder="Lon"
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  step="0.000001"
                />
                <input
                  type="number"
                  value={wp.altitude}
                  onChange={(e) => updateWaypoint(i, 'altitude', parseFloat(e.target.value) || 0)}
                  placeholder="Alt (m)"
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                />
              </div>
            ))}
            {waypoints.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">No waypoints added</div>
            )}
          </div>
        </div>

        <button
          onClick={handleCacheMission}
          disabled={isCaching || !missionId || waypoints.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition-colors"
        >
          {isCaching ? 'Caching...' : 'Cache Mission Offline'}
        </button>

        {cachedMissions.length > 0 && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded border border-gray-700">
            <h3 className="font-semibold mb-3">Cached Missions</h3>
            <div className="space-y-2">
              {cachedMissions.map((mission) => (
                <div key={mission.mission_id} className="flex justify-between items-center p-2 bg-gray-900/50 rounded text-sm">
                  <div>
                    <div className="font-semibold">{mission.mission_id}</div>
                    <div className="text-gray-400 text-xs">
                      Cached: {new Date(mission.cached_at).toLocaleString()}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${mission.synced ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {mission.synced ? 'Synced' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

