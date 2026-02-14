'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface SARMission {
  mission_id: string
  target_type: string
  search_areas: number
  status: string
}

export default function SARDashboard() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [missionId, setMissionId] = useState('')
  const [searchBounds, setSearchBounds] = useState({ minLat: '', minLon: '', maxLat: '', maxLon: '' })
  const [targetType, setTargetType] = useState('person')
  const [isCreating, setIsCreating] = useState(false)
  const [mission, setMission] = useState<SARMission | null>(null)

  const handleCreateMission = async () => {
    if (!missionId.trim()) {
      showError('Please enter a mission ID')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetchWithAuth('/api/sar/create-mission', {
        method: 'POST',
        body: JSON.stringify({
          mission_id: missionId,
          search_bounds: [
            (() => {
              const parsed = parseFloat(searchBounds.minLat)
              return !isNaN(parsed) && parsed >= -90 && parsed <= 90 ? parsed : 0
            })(),
            (() => {
              const parsed = parseFloat(searchBounds.minLon)
              return !isNaN(parsed) && parsed >= -180 && parsed <= 180 ? parsed : 0
            })(),
            (() => {
              const parsed = parseFloat(searchBounds.maxLat)
              return !isNaN(parsed) && parsed >= -90 && parsed <= 90 && parsed > parseFloat(searchBounds.minLat || '0') ? parsed : 1
            })(),
            (() => {
              const parsed = parseFloat(searchBounds.maxLon)
              return !isNaN(parsed) && parsed >= -180 && parsed <= 180 && parsed > parseFloat(searchBounds.minLon || '0') ? parsed : 1
            })()
          ],
          target_type: ['person', 'vehicle', 'aircraft', 'vessel'].includes(targetType) 
            ? targetType 
            : 'person'
        })
      }) as { mission: SARMission }

      setMission(response.mission)
      success('SAR mission created successfully!')
    } catch (err) {
      logger.error('SAR mission error:', err)
      showError('Failed to create SAR mission')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="card-glass p-6">
      <h2 className="text-2xl font-bold mb-4">Search & Rescue Operations</h2>
      
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
          <label className="block text-sm font-medium mb-2">Target Type</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
          >
            <option value="person">Person</option>
            <option value="vehicle">Vehicle</option>
            <option value="aircraft">Aircraft</option>
            <option value="vessel">Vessel</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Search Area Bounds</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={searchBounds.minLat}
              onChange={(e) => setSearchBounds({ ...searchBounds, minLat: e.target.value })}
              placeholder="Min Lat"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              step="0.000001"
            />
            <input
              type="number"
              value={searchBounds.minLon}
              onChange={(e) => setSearchBounds({ ...searchBounds, minLon: e.target.value })}
              placeholder="Min Lon"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              step="0.000001"
            />
            <input
              type="number"
              value={searchBounds.maxLat}
              onChange={(e) => setSearchBounds({ ...searchBounds, maxLat: e.target.value })}
              placeholder="Max Lat"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              step="0.000001"
            />
            <input
              type="number"
              value={searchBounds.maxLon}
              onChange={(e) => setSearchBounds({ ...searchBounds, maxLon: e.target.value })}
              placeholder="Max Lon"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              step="0.000001"
            />
          </div>
        </div>

        <button
          onClick={handleCreateMission}
          disabled={isCreating || !missionId}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition-colors"
        >
          {isCreating ? 'Creating...' : 'Create SAR Mission'}
        </button>

        {mission && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded border border-gray-700">
            <h3 className="font-semibold mb-3">Mission Created</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Mission ID:</span>
                <span className="font-semibold">{mission.mission_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Target Type:</span>
                <span className="font-semibold">{mission.target_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Search Areas:</span>
                <span className="font-semibold">{mission.search_areas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="font-semibold text-green-400">{mission.status}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

