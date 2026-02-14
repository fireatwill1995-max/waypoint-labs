'use client'

import { useState, useEffect } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface FailsafeConfig {
  return_to_home: {
    enabled: boolean
    trigger_battery: number // percentage
    trigger_signal_loss: boolean
    trigger_gps_loss: boolean
    altitude: number // meters
  }
  auto_land: {
    enabled: boolean
    trigger_battery: number // percentage
    trigger_emergency: boolean
  }
  hover_on_loss: {
    enabled: boolean
    duration: number // seconds
  }
  geofence: {
    enabled: boolean
    max_altitude: number // meters
    max_distance: number // meters from home
    action: 'return' | 'land' | 'hover'
  }
  obstacle_avoidance: {
    enabled: boolean
    sensor_type: 'vision' | 'lidar' | 'radar' | 'fusion'
    reaction_distance: number // meters
  }
  battery_safety: {
    warning_level: number // percentage
    critical_level: number // percentage
    reserve_for_return: number // percentage
  }
}

interface FailsafeManagerProps {
  droneId: string
}

export default function FailsafeManager({ droneId }: FailsafeManagerProps) {
  const { fetchWithAuth } = useApi()
  const { success: showSuccess, error: showError } = useToast()
  const [config, setConfig] = useState<FailsafeConfig>({
    return_to_home: {
      enabled: true,
      trigger_battery: 20,
      trigger_signal_loss: true,
      trigger_gps_loss: true,
      altitude: 50,
    },
    auto_land: {
      enabled: true,
      trigger_battery: 10,
      trigger_emergency: true,
    },
    hover_on_loss: {
      enabled: true,
      duration: 30,
    },
    geofence: {
      enabled: true,
      max_altitude: 120,
      max_distance: 500,
      action: 'return',
    },
    obstacle_avoidance: {
      enabled: true,
      sensor_type: 'fusion',
      reaction_distance: 5,
    },
    battery_safety: {
      warning_level: 30,
      critical_level: 15,
      reserve_for_return: 20,
    },
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    
    const loadSafe = async () => {
      if (!mounted) return
      await loadConfig()
    }
    
    loadSafe()
    
    return () => {
      mounted = false
    }
    // Run when droneId or fetchWithAuth changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [droneId, fetchWithAuth])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(`/api/drones/${droneId}/failsafe`) as { failsafe: FailsafeConfig }
      if (response && response.failsafe) {
        setConfig(response.failsafe)
      }
    } catch (error) {
      logger.error('Failed to load failsafe config:', error)
      // Use defaults if load fails
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetchWithAuth(`/api/drones/${droneId}/failsafe`, {
        method: 'POST',
        body: JSON.stringify(config),
      }) as { success: boolean }

      if (response && response.success) {
        showSuccess('Failsafe configuration saved')
      } else {
        showError('Failed to save failsafe configuration')
      }
    } catch (error) {
      logger.error('Failed to save failsafe config:', error)
      showError('Failed to save failsafe configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const updateConfig = (section: keyof FailsafeConfig, updates: Partial<FailsafeConfig[keyof FailsafeConfig]>) => {
    // Validate section exists
    if (!section || !(section in config)) {
      return
    }
    
    // Validate and sanitize numeric updates
    const sanitizedUpdates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'number') {
        // Validate numeric ranges based on field
        if (key.includes('battery') || key.includes('level') || key.includes('percent')) {
          sanitizedUpdates[key] = Math.max(0, Math.min(100, value))
        } else if (key.includes('altitude') || key.includes('distance')) {
          sanitizedUpdates[key] = Math.max(0, Math.min(20000, value))
        } else if (key.includes('duration')) {
          sanitizedUpdates[key] = Math.max(0, Math.min(3600, value))
        } else {
          sanitizedUpdates[key] = value
        }
      } else {
        sanitizedUpdates[key] = value
      }
    }
    
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        ...sanitizedUpdates,
      },
    })
  }

  return (
    <div className="card-glass p-6 space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Failsafe & Safety Configuration</h3>
        <p className="text-slate-400 text-sm">
          Configure automatic safety responses and emergency procedures
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Loading failsafe configuration...</div>
      ) : (
        <div className="space-y-6">
          {/* Return to Home */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-white">Return to Home (RTH)</h4>
                <p className="text-sm text-slate-400">Automatically return to launch point</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.return_to_home.enabled}
                  onChange={(e) =>
                    updateConfig('return_to_home', { enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {config.return_to_home.enabled && (
              <div className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Trigger Battery Level (%)
                    </label>
                    <input
                      type="number"
                      value={config.return_to_home.trigger_battery}
                      onChange={(e) =>
                        updateConfig('return_to_home', {
                          trigger_battery: parseInt(e.target.value) || 20,
                        })
                      }
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                      min="10"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      RTH Altitude (m)
                    </label>
                    <input
                      type="number"
                      value={config.return_to_home.altitude}
                      onChange={(e) =>
                        updateConfig('return_to_home', {
                          altitude: parseInt(e.target.value) || 50,
                        })
                      }
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                      min="10"
                      max="500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.return_to_home.trigger_signal_loss}
                      onChange={(e) =>
                        updateConfig('return_to_home', {
                          trigger_signal_loss: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
                    />
                    <span className="text-slate-300 text-sm">Trigger on signal loss</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.return_to_home.trigger_gps_loss}
                      onChange={(e) =>
                        updateConfig('return_to_home', {
                          trigger_gps_loss: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
                    />
                    <span className="text-slate-300 text-sm">Trigger on GPS loss</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Auto Land */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-white">Auto Land</h4>
                <p className="text-sm text-slate-400">Emergency landing procedures</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.auto_land.enabled}
                  onChange={(e) => updateConfig('auto_land', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {config.auto_land.enabled && (
              <div className="space-y-3 mt-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Critical Battery Level (%)
                  </label>
                  <input
                    type="number"
                    value={config.auto_land.trigger_battery}
                    onChange={(e) =>
                      updateConfig('auto_land', {
                        trigger_battery: parseInt(e.target.value) || 10,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                    min="5"
                    max="20"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.auto_land.trigger_emergency}
                    onChange={(e) =>
                      updateConfig('auto_land', { trigger_emergency: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
                  />
                  <span className="text-slate-300 text-sm">Trigger on emergency signal</span>
                </label>
              </div>
            )}
          </div>

          {/* Geofence */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-white">Geofence</h4>
                <p className="text-sm text-slate-400">Virtual boundaries and altitude limits</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.geofence.enabled}
                  onChange={(e) => updateConfig('geofence', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {config.geofence.enabled && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Max Altitude (m)
                  </label>
                  <input
                    type="number"
                    value={config.geofence.max_altitude}
                    onChange={(e) =>
                      updateConfig('geofence', {
                        max_altitude: parseInt(e.target.value) || 120,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                    min="30"
                    max="500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Max Distance (m)
                  </label>
                  <input
                    type="number"
                    value={config.geofence.max_distance}
                    onChange={(e) =>
                      updateConfig('geofence', {
                        max_distance: parseInt(e.target.value) || 500,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                    min="100"
                    max="10000"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Violation Action
                  </label>
                  <select
                    value={config.geofence.action}
                    onChange={(e) =>
                      updateConfig('geofence', {
                        action: e.target.value as 'return' | 'land' | 'hover',
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="return">Return to Home</option>
                    <option value="land">Land Immediately</option>
                    <option value="hover">Hover in Place</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Battery Safety */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-semibold text-white mb-4">Battery Safety Levels</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Warning Level (%)
                </label>
                <input
                  type="number"
                  value={config.battery_safety.warning_level}
                  onChange={(e) =>
                    updateConfig('battery_safety', {
                      warning_level: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  min="20"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Critical Level (%)
                </label>
                <input
                  type="number"
                  value={config.battery_safety.critical_level}
                  onChange={(e) =>
                    updateConfig('battery_safety', {
                      critical_level: parseInt(e.target.value) || 15,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  min="10"
                  max="30"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Reserve for RTH (%)
                </label>
                <input
                  type="number"
                  value={config.battery_safety.reserve_for_return}
                  onChange={(e) =>
                    updateConfig('battery_safety', {
                      reserve_for_return: parseInt(e.target.value) || 20,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  min="10"
                  max="40"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Failsafe Configuration'}
            </button>
            <button
              onClick={loadConfig}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
