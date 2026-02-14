'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface Drone {
  id: string
  name: string
  type: string
  status: string
  battery_level: number
  flight_hours: number
  health_score: number
  current_mission: string | null
  capabilities: string[]
}

interface FleetHealth {
  total_drones: number
  available_drones: number
  in_mission: number
  maintenance: number
  error: number
  average_battery: number
  average_health_score: number
  total_flight_hours: number
}

export default function FleetManagementDashboard() {
  const { fetchWithAuth } = useApi()
  const { error: showError } = useToast()
  const [drones, setDrones] = useState<Drone[]>([])
  const [health, setHealth] = useState<FleetHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const loadFleetData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load drones
      const dronesResponse = await fetchWithAuth(`/api/fleet/drones${statusFilter ? `?status=${statusFilter}` : ''}`) as { drones: Drone[] }
      setDrones(dronesResponse.drones || [])
      
      // Load fleet health
      const healthResponse = await fetchWithAuth('/api/fleet/health') as { health: FleetHealth }
      setHealth(healthResponse.health || null)
    } catch (err) {
      logger.error('Failed to load fleet data:', err)
      showError('Failed to load fleet data')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, fetchWithAuth, showError])

  useEffect(() => {
    let mounted = true
    
    const loadDataSafe = async () => {
      if (!mounted) return
      await loadFleetData()
    }
    
    loadDataSafe()
    const interval = setInterval(loadDataSafe, 10000) // Refresh every 10s
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
    // Run when filter changes and refresh every 10s
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, fetchWithAuth, showError])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-green-500'
      case 'in_mission': return 'bg-blue-500'
      case 'maintenance': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  if (loading && !health) {
    return (
      <div className="card-glass p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Fleet Health Summary */}
      {health && (
        <div className="card-glass p-6">
          <h2 className="text-2xl font-bold mb-4">Fleet Health Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{health.total_drones}</div>
              <div className="text-sm text-gray-400">Total Drones</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{health.available_drones}</div>
              <div className="text-sm text-gray-400">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{health.in_mission}</div>
              <div className="text-sm text-gray-400">In Mission</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{health.average_battery * 100}%</div>
              <div className="text-sm text-gray-400">Avg Battery</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between text-sm">
              <span>Total Flight Hours: <span className="font-bold">
                {health.total_flight_hours && typeof health.total_flight_hours === 'number' 
                  ? health.total_flight_hours.toFixed(1) 
                  : '0.0'}
              </span></span>
              <span>Health Score: <span className="font-bold">
                {health.average_health_score && typeof health.average_health_score === 'number'
                  ? (health.average_health_score * 100).toFixed(0)
                  : '0'}%
              </span></span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Drone List */}
      <div className="card-glass p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Fleet Drones</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="idle">Idle</option>
            <option value="in_mission">In Mission</option>
            <option value="maintenance">Maintenance</option>
            <option value="error">Error</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div className="space-y-3">
          {drones.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No drones found</div>
          ) : (
            drones.map((drone) => (
              <div
                key={drone.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(drone.status)}`}></div>
                    <div>
                      <div className="font-semibold">{drone.name}</div>
                      <div className="text-sm text-gray-400">Multi-Role • {drone.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <div className="text-gray-400">Battery</div>
                      <div className="font-semibold">
                        {drone.battery_level && typeof drone.battery_level === 'number'
                          ? (drone.battery_level * 100).toFixed(0)
                          : '0'}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Flight Hours</div>
                      <div className="font-semibold">
                        {drone.flight_hours && typeof drone.flight_hours === 'number' && !isNaN(drone.flight_hours)
                          ? drone.flight_hours.toFixed(1)
                          : '0.0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Health</div>
                      <div className="font-semibold">
                        {drone.health_score && typeof drone.health_score === 'number'
                          ? (drone.health_score * 100).toFixed(0)
                          : '0'}%
                      </div>
                    </div>
                    {drone.current_mission && (
                      <div className="text-blue-400">
                        <div className="text-gray-400">Mission</div>
                        <div className="font-semibold">{drone.current_mission}</div>
                      </div>
                    )}
                  </div>
                </div>
                {drone.capabilities && drone.capabilities.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {drone.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

