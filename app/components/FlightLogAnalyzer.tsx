'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface FlightAnalysis {
  flight_id: string
  anomalies: Array<{
    type: string
    timestamp: string
    severity: string
    description: string
  }>
  performance_metrics: {
    total_distance_km: number
    total_duration_minutes: number
    average_speed_mps: number
    max_altitude_m: number
    max_speed_mps: number
    battery_efficiency: number
  }
  safety_events: Array<{
    type: string
    timestamp: string
    severity: string
    description: string
  }>
  recommendations: string[]
}

export default function FlightLogAnalyzer() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [flightId, setFlightId] = useState('')
  const [analysis, setAnalysis] = useState<FlightAnalysis | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!flightId.trim()) {
      showError('Please enter a flight ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetchWithAuth(`/api/analytics/flight-log/${flightId}/analyze`) as { analysis: FlightAnalysis }
      if (response && response.analysis) {
        setAnalysis(response.analysis)
        success('Flight log analyzed successfully!')
      } else {
        showError('Invalid response from server')
      }
    } catch (err) {
      logger.error('Flight log analysis error:', err)
      showError('Failed to analyze flight log')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="card-glass p-6">
      <h2 className="text-2xl font-bold mb-4">Flight Log Analyzer</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Flight ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={flightId}
              onChange={(e) => setFlightId(e.target.value)}
              placeholder="Enter flight ID"
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !flightId}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-4 py-2 rounded font-semibold transition-colors"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {analysis && (
          <div className="mt-6 space-y-4">
            {/* Performance Metrics */}
            <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
              <h3 className="font-semibold mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Distance:</span>
                  <span className="ml-2 font-semibold">
                    {analysis.performance_metrics?.total_distance_km && typeof analysis.performance_metrics.total_distance_km === 'number' && !isNaN(analysis.performance_metrics.total_distance_km)
                      ? analysis.performance_metrics.total_distance_km.toFixed(2)
                      : '0.00'} km
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <span className="ml-2 font-semibold">
                    {analysis.performance_metrics?.total_duration_minutes && typeof analysis.performance_metrics.total_duration_minutes === 'number' && !isNaN(analysis.performance_metrics.total_duration_minutes)
                      ? analysis.performance_metrics.total_duration_minutes.toFixed(1)
                      : '0.0'} min
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Avg Speed:</span>
                  <span className="ml-2 font-semibold">
                    {analysis.performance_metrics?.average_speed_mps && typeof analysis.performance_metrics.average_speed_mps === 'number' && !isNaN(analysis.performance_metrics.average_speed_mps)
                      ? analysis.performance_metrics.average_speed_mps.toFixed(1)
                      : '0.0'} m/s
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Max Altitude:</span>
                  <span className="ml-2 font-semibold">
                    {analysis.performance_metrics?.max_altitude_m && typeof analysis.performance_metrics.max_altitude_m === 'number' && !isNaN(analysis.performance_metrics.max_altitude_m)
                      ? analysis.performance_metrics.max_altitude_m.toFixed(1)
                      : '0.0'} m
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Max Speed:</span>
                  <span className="ml-2 font-semibold">
                    {analysis.performance_metrics?.max_speed_mps && typeof analysis.performance_metrics.max_speed_mps === 'number' && !isNaN(analysis.performance_metrics.max_speed_mps)
                      ? analysis.performance_metrics.max_speed_mps.toFixed(1)
                      : '0.0'} m/s
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Battery Efficiency:</span>
                  <span className="ml-2 font-semibold">
                    {analysis.performance_metrics?.battery_efficiency && typeof analysis.performance_metrics.battery_efficiency === 'number' && !isNaN(analysis.performance_metrics.battery_efficiency)
                      ? analysis.performance_metrics.battery_efficiency.toFixed(2)
                      : '0.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Anomalies */}
            {analysis.anomalies && Array.isArray(analysis.anomalies) && analysis.anomalies.length > 0 && (
              <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                <h3 className="font-semibold mb-3">Anomalies Detected</h3>
                <div className="space-y-2">
                  {analysis.anomalies.map((anomaly, i) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold">{anomaly.type}</span>
                        <span className={getSeverityColor(anomaly.severity)}>{anomaly.severity}</span>
                      </div>
                      <div className="text-gray-400 mt-1">{String(anomaly.description || '').slice(0, 500)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Safety Events */}
            {analysis.safety_events && Array.isArray(analysis.safety_events) && analysis.safety_events.length > 0 && (
              <div className="p-4 bg-red-900/20 rounded border border-red-700">
                <h3 className="font-semibold mb-3 text-red-400">Safety Events</h3>
                <div className="space-y-2">
                  {analysis.safety_events.map((event, i) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold">{event.type}</span>
                        <span className={getSeverityColor(event.severity)}>{event.severity}</span>
                      </div>
                      <div className="text-gray-400 mt-1">{String(event.description || '').slice(0, 500)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0 && (
              <div className="p-4 bg-blue-900/20 rounded border border-blue-700">
                <h3 className="font-semibold mb-3 text-blue-400">Recommendations</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i}>{String(rec || '').slice(0, 500)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

