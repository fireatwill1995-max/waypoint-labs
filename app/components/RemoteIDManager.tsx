'use client'

import { useState, useEffect } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface RemoteIDStatus {
  enabled: boolean
  compliant: boolean
  serial_number?: string
  operator_id?: string
  registration_id?: string
  standard: 'opendroneid' | 'astm_f3411' | 'none'
  broadcast_status: 'active' | 'inactive' | 'error'
  last_broadcast?: string
  location?: {
    lat: number
    lon: number
    alt: number
  }
  violations?: Array<{
    type: string
    description: string
    severity: 'warning' | 'error'
  }>
}

interface RemoteIDManagerProps {
  droneId: string
}

export default function RemoteIDManager({ droneId }: RemoteIDManagerProps) {
  const { fetchWithAuth } = useApi()
  const { success: showSuccess, error: showError } = useToast()
  const [remoteIdStatus, setRemoteIdStatus] = useState<RemoteIDStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [operatorInfo, setOperatorInfo] = useState({
    operator_id: '',
    registration_id: '',
  })

  useEffect(() => {
    let mounted = true
    
    const loadSafe = async () => {
      if (!mounted) return
      await loadRemoteIDStatus()
    }
    
    loadSafe()
    
    return () => {
      mounted = false
    }
    // Run when droneId or auth changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [droneId, fetchWithAuth, showError])

  const loadRemoteIDStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(`/api/drones/${droneId}/remote-id`) as { remote_id: RemoteIDStatus }
      if (response && response.remote_id) {
        setRemoteIdStatus(response.remote_id)
        setOperatorInfo({
          operator_id: response.remote_id.operator_id || '',
          registration_id: response.remote_id.registration_id || '',
        })
      }
    } catch (error) {
      logger.error('Failed to load Remote ID status:', error)
      showError('Failed to load Remote ID status')
    } finally {
      setIsLoading(false)
    }
  }

  const enableRemoteID = async () => {
    try {
      const response = await fetchWithAuth(`/api/drones/${droneId}/remote-id/enable`, {
        method: 'POST',
        body: JSON.stringify({
          operator_id: String(operatorInfo.operator_id || '').trim().slice(0, 100),
          registration_id: String(operatorInfo.registration_id || '').trim().slice(0, 100),
        }),
      }) as { success: boolean }

      if (response && response.success) {
        showSuccess('Remote ID enabled')
        await loadRemoteIDStatus()
      }
    } catch (error) {
      logger.error('Failed to enable Remote ID:', error)
      showError('Failed to enable Remote ID')
    }
  }

  const disableRemoteID = async () => {
    try {
      // Sanitize droneId
      const sanitizedDroneId = String(droneId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100)
      if (!sanitizedDroneId) {
        showError('Invalid drone ID')
        return
      }
      
      const response = await fetchWithAuth(`/api/drones/${encodeURIComponent(sanitizedDroneId)}/remote-id/disable`, {
        method: 'POST',
      }) as { success: boolean }

      if (response && response.success) {
        showSuccess('Remote ID disabled')
        await loadRemoteIDStatus()
      }
    } catch (error) {
      logger.error('Failed to disable Remote ID:', error)
      showError('Failed to disable Remote ID')
    }
  }

  const updateOperatorInfo = async () => {
    try {
      const response = await fetchWithAuth(`/api/drones/${droneId}/remote-id/operator`, {
        method: 'POST',
        body: JSON.stringify(operatorInfo),
      }) as { success: boolean }

      if (response && response.success) {
        showSuccess('Operator information updated')
        await loadRemoteIDStatus()
      }
    } catch (error) {
      logger.error('Failed to update operator info:', error)
      showError('Failed to update operator information')
    }
  }

  return (
    <div className="card-glass p-6 space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Remote ID Management</h3>
        <p className="text-slate-400 text-sm">
          Configure and monitor Remote ID compliance (FAA/ICAO requirements)
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Loading Remote ID status...</div>
      ) : remoteIdStatus ? (
        <>
          {/* Status Overview */}
          <div
            className={`p-4 rounded-lg border ${
              remoteIdStatus.compliant
                ? 'bg-green-900/20 border-green-700'
                : 'bg-red-900/20 border-red-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-white">Remote ID Status</h4>
                <p className="text-sm text-slate-400">
                  Standard: {remoteIdStatus.standard === 'opendroneid' ? 'OpenDroneID' : remoteIdStatus.standard === 'astm_f3411' ? 'ASTM F3411' : 'None'}
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${
                    remoteIdStatus.compliant ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {remoteIdStatus.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {remoteIdStatus.enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>

            {remoteIdStatus.broadcast_status && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-slate-400 text-sm">Broadcast:</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    remoteIdStatus.broadcast_status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : remoteIdStatus.broadcast_status === 'error'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {remoteIdStatus.broadcast_status.toUpperCase()}
                </span>
                {remoteIdStatus.last_broadcast && (
                  <span className="text-xs text-slate-400 ml-2">
                    Last: {new Date(remoteIdStatus.last_broadcast).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Violations */}
          {remoteIdStatus.violations && remoteIdStatus.violations.length > 0 && (
            <div className="p-4 bg-red-900/20 rounded-lg border border-red-700">
              <h4 className="font-semibold text-red-400 mb-3">Compliance Violations</h4>
              <div className="space-y-2">
                {remoteIdStatus.violations.map((violation, i) => (
                  <div key={i} className="p-2 bg-gray-900/50 rounded text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{violation.type}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          violation.severity === 'error'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {violation.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-400">{violation.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operator Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Operator Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Operator ID
                </label>
                <input
                  type="text"
                  value={operatorInfo.operator_id}
                  onChange={(e) =>
                    setOperatorInfo({ ...operatorInfo, operator_id: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter operator ID"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Registration ID
                </label>
                <input
                  type="text"
                  value={operatorInfo.registration_id}
                  onChange={(e) =>
                    setOperatorInfo({ ...operatorInfo, registration_id: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter registration ID"
                />
              </div>
            </div>
            <button
              onClick={updateOperatorInfo}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              Update Operator Information
            </button>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            {remoteIdStatus.enabled ? (
              <button
                onClick={disableRemoteID}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
              >
                Disable Remote ID
              </button>
            ) : (
              <button
                onClick={enableRemoteID}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
              >
                Enable Remote ID
              </button>
            )}
            <button
              onClick={loadRemoteIDStatus}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              Refresh
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <p>Remote ID not available</p>
          <p className="text-sm mt-2">This drone may not support Remote ID</p>
        </div>
      )}
    </div>
  )
}
