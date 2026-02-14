'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useApi } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { logger } from '../../lib/logger'
import { handleApiError } from '../../lib/utils'

interface PerformanceData {
  timestamp: string
  cpu: number
  memory: number
  network: number
  disk: number
  requests_per_second: number
  response_time: number
  error_rate: number
}

export default function PerformanceMonitor() {
  const [data, setData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const { fetchWithAuth } = useApi()
  const { error: showError } = useToast()
  const loadingRef = useRef(true)

  const loadPerformanceData = useCallback(async () => {
    try {
      const result = await fetchWithAuth('/api/admin/performance') as { data?: PerformanceData[] } | null
      setData(result?.data || [])
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to load performance data')
      logger.error('Failed to load performance data:', error)
      // Only show toast on first load, not on every refresh
      if (loadingRef.current) {
        showError(errorMessage)
      }
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [fetchWithAuth, showError])

  useEffect(() => {
    let mounted = true
    
    const loadDataSafe = async () => {
      if (!mounted) return
      await loadPerformanceData()
    }
    
    loadDataSafe()
    const interval = setInterval(loadDataSafe, 5000)
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
    // Run on mount and refresh every 5s
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPerformanceData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const latest = data[data.length - 1] || {
    cpu: 0,
    memory: 0,
    network: 0,
    disk: 0,
    requests_per_second: 0,
    response_time: 0,
    error_rate: 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Performance Monitor</h2>
          <p className="text-slate-400">Real-time system performance metrics</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-emerald-500/30">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-emerald-400">LIVE</span>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="CPU Usage" value={latest.cpu} unit="%" color="blue" />
        <MetricCard title="Memory Usage" value={latest.memory} unit="%" color="green" />
        <MetricCard title="Network I/O" value={latest.network} unit="MB/s" color="purple" />
        <MetricCard title="Disk I/O" value={latest.disk} unit="MB/s" color="yellow" />
      </div>

      {/* Application Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-glass p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Request Rate</h3>
          <div className="text-4xl font-bold text-white mb-2">
            {typeof latest.requests_per_second === 'number' && !isNaN(latest.requests_per_second)
              ? latest.requests_per_second.toFixed(1)
              : '0.0'}
            <span className="text-lg text-slate-400 ml-2">req/s</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ 
                width: `${typeof latest.requests_per_second === 'number' && !isNaN(latest.requests_per_second)
                  ? Math.min(100, (latest.requests_per_second / 100) * 100)
                  : 0}%` 
              }}
            ></div>
          </div>
        </div>

        <div className="card-glass p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Response Time</h3>
          <div className="text-4xl font-bold text-white mb-2">
            {typeof latest.response_time === 'number' && !isNaN(latest.response_time)
              ? latest.response_time.toFixed(0)
              : '0'}
            <span className="text-lg text-slate-400 ml-2">ms</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
            <div
              className={`h-2 rounded-full transition-all ${
                (typeof latest.response_time === 'number' && latest.response_time > 500)
                  ? 'bg-red-500' 
                  : (typeof latest.response_time === 'number' && latest.response_time > 200) 
                    ? 'bg-yellow-500' 
                    : 'bg-emerald-500'
              }`}
              style={{ 
                width: `${typeof latest.response_time === 'number' && !isNaN(latest.response_time)
                  ? Math.min(100, (latest.response_time / 1000) * 100)
                  : 0}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Error Rate */}
      <div className="card-glass p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Error Rate</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-white">
            {latest.error_rate.toFixed(2)}
            <span className="text-lg text-slate-400 ml-2">%</span>
          </div>
          <div className="flex-1">
            <div className="w-full bg-slate-800 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  (typeof latest.error_rate === 'number' && latest.error_rate > 5) 
                    ? 'bg-red-500' 
                    : (typeof latest.error_rate === 'number' && latest.error_rate > 2) 
                      ? 'bg-yellow-500' 
                      : 'bg-emerald-500'
                }`}
                style={{ 
                  width: `${typeof latest.error_rate === 'number' && !isNaN(latest.error_rate)
                    ? Math.min(100, latest.error_rate * 10)
                    : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, unit, color = 'blue' }: {
  title: string
  value: number
  unit: string
  color?: 'blue' | 'green' | 'purple' | 'yellow'
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-pink-500',
    yellow: 'from-yellow-500 to-orange-500'
  }

  const gradientClass = colorClasses[color] || colorClasses.blue

  return (
    <div className="card-glass p-6 border-l-4" style={{ borderLeftColor: `var(--${color}-500)` }}>
      <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
      <div className={`text-3xl font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>
        {typeof value === 'number' && !isNaN(value) ? value.toFixed(1) : '0.0'}
        <span className="text-lg text-slate-400 ml-1">{unit}</span>
      </div>
    </div>
  )
}

