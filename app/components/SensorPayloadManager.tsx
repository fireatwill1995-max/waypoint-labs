'use client'

import { useState, useEffect } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface SensorPayload {
  id: string
  name: string
  type: 'rgb_camera' | 'thermal' | 'multispectral' | 'hyperspectral' | 'lidar' | 'radar' | 'sonar' | 'magnetometer' | 'gas_sensor' | 'weather_station'
  status: 'active' | 'inactive' | 'error'
  capabilities: string[]
  calibration?: {
    last_calibrated: string
    accuracy: number
  }
  data_stream?: {
    format: string
    resolution?: string
    fps?: number
    bitrate?: number
  }
}

interface SensorPayloadManagerProps {
  droneId: string
}

export default function SensorPayloadManager({ droneId }: SensorPayloadManagerProps) {
  const { fetchWithAuth } = useApi()
  const { success: showSuccess, error: showError } = useToast()
  const [payloads, setPayloads] = useState<SensorPayload[]>([])
  const [selectedPayload, setSelectedPayload] = useState<SensorPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    
    const loadSafe = async () => {
      if (!mounted) return
      await loadPayloads()
    }
    
    loadSafe()
    
    return () => {
      mounted = false
    }
    // Run when droneId or auth changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [droneId, fetchWithAuth, showError])

  const loadPayloads = async () => {
    setIsLoading(true)
    try {
      // Sanitize droneId
      const sanitizedDroneId = String(droneId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100)
      if (!sanitizedDroneId) {
        showError('Invalid drone ID')
        setIsLoading(false)
        return
      }
      
      const response = await fetchWithAuth(`/api/drones/${encodeURIComponent(sanitizedDroneId)}/payloads`) as { payloads?: SensorPayload[] } | null
      if (response && Array.isArray(response.payloads)) {
        // Validate payload structure
        const validPayloads = response.payloads.filter((p): p is SensorPayload => {
          return (
            typeof p === 'object' &&
            p !== null &&
            typeof p.id === 'string' &&
            typeof p.name === 'string' &&
            typeof p.type === 'string' &&
            typeof p.status === 'string' &&
            Array.isArray(p.capabilities)
          )
        })
        setPayloads(validPayloads)
      } else {
        setPayloads([])
      }
    } catch (error) {
      logger.error('Failed to load payloads:', error)
      showError('Failed to load sensor payloads')
    } finally {
      setIsLoading(false)
    }
  }

  const activatePayload = async (payloadId: string) => {
    try {
      const response = await fetchWithAuth(`/api/drones/${droneId}/payloads/${payloadId}/activate`, {
        method: 'POST',
      }) as { success: boolean }

      if (response && response.success) {
        showSuccess('Payload activated')
        await loadPayloads()
      }
    } catch (error) {
      logger.error('Failed to activate payload:', error)
      showError('Failed to activate payload')
    }
  }

  const deactivatePayload = async (payloadId: string) => {
    try {
      const response = await fetchWithAuth(`/api/drones/${droneId}/payloads/${payloadId}/deactivate`, {
        method: 'POST',
      }) as { success: boolean }

      if (response && response.success) {
        showSuccess('Payload deactivated')
        await loadPayloads()
      }
    } catch (error) {
      logger.error('Failed to deactivate payload:', error)
      showError('Failed to deactivate payload')
    }
  }

  const getPayloadIcon = (type: SensorPayload['type']) => {
    const icons: Record<SensorPayload['type'], string> = {
      rgb_camera: '📷',
      thermal: '🌡️',
      multispectral: '🌈',
      hyperspectral: '🔬',
      lidar: '📡',
      radar: '📻',
      sonar: '🌊',
      magnetometer: '🧲',
      gas_sensor: '💨',
      weather_station: '🌤️',
    }
    return icons[type] || '📦'
  }

  const getPayloadTypeLabel = (type: SensorPayload['type']) => {
    const labels: Record<SensorPayload['type'], string> = {
      rgb_camera: 'RGB Camera',
      thermal: 'Thermal Camera',
      multispectral: 'Multispectral',
      hyperspectral: 'Hyperspectral',
      lidar: 'LiDAR',
      radar: 'Radar',
      sonar: 'Sonar',
      magnetometer: 'Magnetometer',
      gas_sensor: 'Gas Sensor',
      weather_station: 'Weather Station',
    }
    return labels[type] || type
  }

  return (
    <div className="card-glass p-6 space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Sensor & Payload Management</h3>
        <p className="text-slate-400 text-sm">
          Manage and control sensor payloads attached to the drone
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Loading payloads...</div>
      ) : payloads.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p>No payloads detected</p>
          <p className="text-sm mt-2">Connect a sensor payload to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payloads.map((payload) => (
            <div
              key={payload.id}
              className={`p-4 rounded-lg border transition-all ${
                selectedPayload?.id === payload.id
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
              onClick={() => setSelectedPayload(payload)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-3xl">{getPayloadIcon(payload.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-white">{payload.name}</h4>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300">
                        {getPayloadTypeLabel(payload.type)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          payload.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : payload.status === 'error'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {payload.status.toUpperCase()}
                      </span>
                    </div>
                    {payload.capabilities && payload.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {payload.capabilities.slice(0, 3).map((cap, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded text-xs bg-slate-700/50 text-slate-400"
                          >
                            {cap}
                          </span>
                        ))}
                        {payload.capabilities.length > 3 && (
                          <span className="px-2 py-1 rounded text-xs bg-slate-700/50 text-slate-400">
                            +{payload.capabilities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    {payload.data_stream && (
                      <div className="text-xs text-slate-400 mt-2">
                        Stream: {payload.data_stream.format}
                        {payload.data_stream.resolution && ` @ ${payload.data_stream.resolution}`}
                        {payload.data_stream.fps && ` ${payload.data_stream.fps}fps`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {payload.status === 'active' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deactivatePayload(payload.id)
                      }}
                      className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        activatePayload(payload.id)
                      }}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPayload && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <h4 className="text-lg font-semibold text-white mb-4">Payload Details</h4>
          <div className="space-y-3">
            <div>
              <span className="text-slate-400 text-sm">Type:</span>
              <span className="ml-2 text-white">{getPayloadTypeLabel(selectedPayload.type)}</span>
            </div>
            {selectedPayload.calibration && (
              <div>
                <span className="text-slate-400 text-sm">Last Calibrated:</span>
                <span className="ml-2 text-white">
                  {new Date(selectedPayload.calibration.last_calibrated).toLocaleString()}
                </span>
                <span className="ml-2 text-slate-400">
                  (Accuracy: {selectedPayload.calibration.accuracy}%)
                </span>
              </div>
            )}
            {selectedPayload.capabilities && selectedPayload.capabilities.length > 0 && (
              <div>
                <span className="text-slate-400 text-sm block mb-2">Capabilities:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedPayload.capabilities.map((cap, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-sm"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
