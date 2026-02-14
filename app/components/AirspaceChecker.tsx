'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface AirspaceCheck {
  clear: boolean
  violations: Array<{
    restriction_id: string
    type: string
    name: string
    description: string
    requires_authorization: boolean
  }>
  warnings: Array<{
    restriction_id: string
    type: string
    name: string
    description: string
  }>
  authorizations: Array<{
    restriction_id: string
    authorization_id: string
    expires_at: string
  }>
  checked_at: string
}

export default function AirspaceChecker() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [location, setLocation] = useState({ lat: '', lon: '' })
  const [altitude, setAltitude] = useState('100')
  const [isChecking, setIsChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<AirspaceCheck | null>(null)

  const handleCheck = async () => {
    if (!location.lat || !location.lon) {
      showError('Please enter location coordinates')
      return
    }

    // Validate and sanitize coordinates
    const lat = parseFloat(location.lat)
    const lon = parseFloat(location.lon)
    const alt = parseFloat(altitude)
    
    if (isNaN(lat) || isNaN(lon) || isNaN(alt)) {
      showError('Please enter valid numeric coordinates')
      return
    }
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      showError('Invalid coordinate range. Latitude must be -90 to 90, Longitude must be -180 to 180')
      return
    }
    
    if (alt < 0 || alt > 20000) {
      showError('Invalid altitude. Must be between 0 and 20000 meters')
      return
    }

    setIsChecking(true)
    try {
      const response = await fetchWithAuth('/api/safety/airspace/check', {
        method: 'POST',
        body: JSON.stringify({
          location: [lat, lon],
          altitude: alt
        })
      }) as { airspace_check?: AirspaceCheck }

      // Validate response structure
      if (!response || !response.airspace_check) {
        throw new Error('Invalid response from server')
      }
      
      setCheckResult(response.airspace_check)
      
      if (response.airspace_check.clear) {
        success('Airspace is clear for flight!')
      } else {
        const violations = Array.isArray(response.airspace_check.violations) 
          ? response.airspace_check.violations 
          : []
        showError(`Airspace check failed: ${violations.length} violation(s) found`)
      }
    } catch (err) {
      logger.error('Airspace check error:', err)
      showError('Failed to check airspace')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="card-glass p-6">
      <h2 className="text-2xl font-bold mb-4">Airspace Restriction Check</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Latitude</label>
            <input
              type="number"
              value={location.lat}
              onChange={(e) => setLocation({ ...location, lat: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
              step="0.000001"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Longitude</label>
            <input
              type="number"
              value={location.lon}
              onChange={(e) => setLocation({ ...location, lon: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
              step="0.000001"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Altitude (m)</label>
            <input
              type="number"
              value={altitude}
              onChange={(e) => setAltitude(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
              min="0"
              max="500"
            />
          </div>
        </div>

        <button
          onClick={handleCheck}
          disabled={isChecking}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition-colors"
        >
          {isChecking ? 'Checking...' : 'Check Airspace'}
        </button>

        {checkResult && (
          <div className="mt-6 space-y-4">
            {/* Status */}
            <div className={`p-4 rounded border ${checkResult.clear ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Airspace Status</span>
                <span className={`text-xl font-bold ${checkResult.clear ? 'text-green-400' : 'text-red-400'}`}>
                  {checkResult.clear ? 'CLEAR' : 'RESTRICTED'}
                </span>
              </div>
            </div>

            {/* Violations */}
            {checkResult.violations && Array.isArray(checkResult.violations) && checkResult.violations.length > 0 && (
              <div className="p-4 bg-red-900/20 rounded border border-red-700">
                <h3 className="font-semibold mb-3 text-red-400">Violations</h3>
                <div className="space-y-2">
                  {checkResult.violations.map((violation, i) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-sm">
                      <div className="font-semibold">{violation.name}</div>
                      <div className="text-gray-400 mt-1">{violation.description}</div>
                      {violation.requires_authorization && (
                        <div className="text-yellow-400 mt-1 text-xs">⚠️ Authorization required</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {checkResult.warnings.length > 0 && (
              <div className="p-4 bg-yellow-900/20 rounded border border-yellow-700">
                <h3 className="font-semibold mb-3 text-yellow-400">Warnings</h3>
                <div className="space-y-2">
                  {checkResult.warnings.map((warning, i) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-sm">
                      <div className="font-semibold">{warning.name}</div>
                      <div className="text-gray-400 mt-1">{warning.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Authorizations */}
            {checkResult.authorizations && Array.isArray(checkResult.authorizations) && checkResult.authorizations.length > 0 && (
              <div className="p-4 bg-green-900/20 rounded border border-green-700">
                <h3 className="font-semibold mb-3 text-green-400">Active Authorizations</h3>
                <div className="space-y-2">
                  {checkResult.authorizations.map((auth, i) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-sm">
                      <div className="font-semibold">Authorization: {auth.authorization_id}</div>
                      {auth.expires_at && (
                        <div className="text-gray-400 mt-1">
                          Expires: {new Date(String(auth.expires_at)).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

