'use client'

import { useState, useEffect } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface Drone {
  id: string
  name: string
  protocol: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  telemetry?: {
    battery: number
    position: { lat: number; lon: number; alt: number }
    velocity: { vx: number; vy: number; vz: number }
    mode: string
    signal_strength: number
  }
  lastUpdate?: string
}

export default function FleetManagement() {
  const [drones, setDrones] = useState<Drone[]>([])
  const [selectedDrones, setSelectedDrones] = useState<Set<string>>(new Set())
  const [fleetMode, setFleetMode] = useState<'individual' | 'swarm' | 'formation'>('individual')
  const { fetchWithAuth } = useApi()
  const { success: showSuccess, error: showError } = useToast()

  useEffect(() => {
    let mounted = true
    
    const loadFleetSafe = async () => {
      if (!mounted) return
      await loadFleet()
    }
    
    loadFleetSafe()
    const interval = setInterval(loadFleetSafe, 2000) // Update every 2 seconds
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
    // Run on mount and refresh every 2s
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchWithAuth])

  const loadFleet = async () => {
    try {
      const response = await fetchWithAuth('/api/drones/connections')
      if (response && Array.isArray(response)) {
        const fleet: Drone[] = response
          .filter((conn): conn is DroneConnection => {
            return (
              typeof conn === 'object' &&
              conn !== null &&
              'id' in conn &&
              'protocol' in conn &&
              'status' in conn
            )
          })
          .map((conn) => {
            // Validate and sanitize connection data
            const safeId = String(conn.id || '').slice(0, 100)
            const safeProtocol = String(conn.protocol || 'unknown').slice(0, 50)
            const safeStatus = String(conn.status || 'unknown').slice(0, 50)
            
            return {
              id: safeId,
              name: safeId.length >= 4 ? `Drone ${safeId.slice(-4)}` : `Drone ${safeId}`,
              protocol: safeProtocol,
              status: safeStatus as 'connected' | 'disconnected' | 'connecting' | 'error',
              telemetry: conn.telemetry || undefined,
              lastUpdate: new Date().toISOString(),
            }
          })
        setDrones(fleet)
      }
    } catch (error) {
      logger.error('Failed to load fleet:', error)
    }
  }

  interface DroneConnection {
    id: string
    protocol: string
    status: 'connected' | 'disconnected' | 'connecting' | 'error'
    telemetry?: {
      battery: number
      position: { lat: number; lon: number; alt: number }
      velocity: { vx: number; vy: number; vz: number }
      mode: string
      signal_strength: number
    }
  }

  const handleSelectDrone = (id: string) => {
    const newSelected = new Set(selectedDrones)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDrones(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedDrones.size === drones.length) {
      setSelectedDrones(new Set())
    } else {
      setSelectedDrones(new Set(drones.map((d) => d.id)))
    }
  }

  const handleFleetCommand = async (command: string) => {
    if (selectedDrones.size === 0) {
      showError('Please select at least one drone')
      return
    }

    try {
      const response = await fetchWithAuth('/api/drones/fleet/command', {
        method: 'POST',
        body: JSON.stringify({
          drone_ids: Array.from(selectedDrones),
          command,
          mode: fleetMode,
        }),
      }) as { success?: boolean } | null

      if (response && response.success) {
        showSuccess(`Command sent to ${selectedDrones.size} drone(s)`)
      } else {
        showError('Failed to send fleet command')
      }
    } catch (error) {
      showError('Failed to send fleet command')
      logger.error('Fleet command error:', error)
    }
  }

  const connectedCount = drones.filter((d) => d.status === 'connected').length
  const totalBattery = drones
    .filter((d) => d.telemetry && typeof d.telemetry.battery === 'number')
    .reduce((sum, d) => {
      const battery = d.telemetry?.battery
      return sum + (typeof battery === 'number' && !isNaN(battery) ? battery : 0)
    }, 0)
  const avgBattery = connectedCount > 0 && totalBattery > 0 
    ? totalBattery / connectedCount 
    : 0

  return (
    <div className="space-y-6">
      {/* Fleet Overview */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Fleet Management</h3>
            <p className="text-slate-400 text-sm">Manage multiple drones simultaneously</p>
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="fleet-mode" className="sr-only">Fleet Control Mode</label>
            <select
              id="fleet-mode"
              value={fleetMode}
              onChange={(e) => {
                const value = e.target.value
                if (value === 'individual' || value === 'swarm' || value === 'formation') {
                  setFleetMode(value)
                }
              }}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
              aria-label="Select fleet control mode"
            >
              <option value="individual">Individual Control</option>
              <option value="swarm">Swarm Mode</option>
              <option value="formation">Formation Flying</option>
            </select>
          </div>
        </div>

        {/* Fleet Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-slate-400 text-sm mb-1">Total Drones</div>
            <div className="text-3xl font-bold text-white">{drones.length}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-slate-400 text-sm mb-1">Connected</div>
            <div className="text-3xl font-bold text-green-400">{connectedCount}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-slate-400 text-sm mb-1">Avg Battery</div>
            <div className="text-3xl font-bold text-blue-400">
              {typeof avgBattery === 'number' && !isNaN(avgBattery) ? avgBattery.toFixed(0) : '0'}%
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-slate-400 text-sm mb-1">Selected</div>
            <div className="text-3xl font-bold text-yellow-400">{selectedDrones.size}</div>
          </div>
        </div>

        {/* Fleet Actions */}
        {selectedDrones.size > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <button
              onClick={() => handleFleetCommand('takeoff')}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
              aria-label={`Takeoff ${selectedDrones.size} selected drone(s)`}
            >
              Takeoff All
            </button>
            <button
              onClick={() => handleFleetCommand('land')}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
              aria-label={`Land ${selectedDrones.size} selected drone(s)`}
            >
              Land All
            </button>
            <button
              onClick={() => handleFleetCommand('return_to_base')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
              aria-label={`Return ${selectedDrones.size} selected drone(s) to base`}
            >
              Return to Base
            </button>
            <button
              onClick={() => handleFleetCommand('formation')}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors"
              aria-label={`Form ${selectedDrones.size} selected drone(s) into formation`}
            >
              Form Up
            </button>
            <button
              onClick={() => handleFleetCommand('disconnect')}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
              aria-label={`Disconnect ${selectedDrones.size} selected drone(s)`}
            >
              Disconnect All
            </button>
          </div>
        )}
      </div>

      {/* Drone List */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-white">Drone Fleet</h4>
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors"
            aria-label={selectedDrones.size === drones.length ? 'Deselect all drones' : 'Select all drones'}
          >
            {selectedDrones.size === drones.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {drones.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No drones connected</p>
            <p className="text-sm mt-2">Connect drones to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drones.map((drone) => (
              <div
                key={drone.id}
                role="button"
                tabIndex={0}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedDrones.has(drone.id)
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => handleSelectDrone(drone.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectDrone(drone.id)
                  }
                }}
                aria-label={`${drone.name} - ${drone.status} - ${selectedDrones.has(drone.id) ? 'Selected' : 'Not selected'}`}
                aria-pressed={selectedDrones.has(drone.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedDrones.has(drone.id)}
                      onChange={() => handleSelectDrone(drone.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-semibold">{drone.name}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            drone.status === 'connected'
                              ? 'bg-green-500/20 text-green-400'
                              : drone.status === 'connecting'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {drone.status.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                          {drone.protocol}
                        </span>
                      </div>

                      {drone.telemetry && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400">
                          <div>
                            <span className="text-slate-500">Battery:</span>{' '}
                            <span className="text-white">
                              {drone.telemetry?.battery && typeof drone.telemetry.battery === 'number' 
                                ? (drone.telemetry.battery * 100).toFixed(0) 
                                : '0'}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Mode:</span>{' '}
                            <span className="text-white">{drone.telemetry?.mode ? String(drone.telemetry.mode) : 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Signal:</span>{' '}
                            <span className="text-white">
                              {drone.telemetry?.signal_strength && typeof drone.telemetry.signal_strength === 'number'
                                ? (drone.telemetry.signal_strength * 100).toFixed(0)
                                : '0'}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Altitude:</span>{' '}
                            <span className="text-white">
                              {drone.telemetry?.position?.alt && typeof drone.telemetry.position.alt === 'number'
                                ? drone.telemetry.position.alt.toFixed(1)
                                : '0.0'}m
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

