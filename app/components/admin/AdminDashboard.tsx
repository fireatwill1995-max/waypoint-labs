'use client'

import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { logger } from '../../lib/logger'
import { handleApiError } from '../../lib/utils'

interface SystemMetrics {
  system_status: string
  active_drones: number
  total_detections: number
  active_tracks: number
  system_uptime: number
  cpu_usage: number
  memory_usage: number
  network_latency: number
  error_rate: number
  active_users: number
  api_requests_per_minute: number
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const { fetchWithAuth } = useApi()
  const { error: showError } = useToast()

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await fetchWithAuth('/api/admin/metrics') as SystemMetrics
        setMetrics(data)
      } catch (error) {
        const errorMessage = handleApiError(error, 'Failed to load system metrics')
        logger.error('Failed to load metrics:', error)
        // Only show toast on first load, not on every refresh
        if (loading) {
          showError(errorMessage)
        }
      } finally {
        setLoading(false)
      }
    }

    let mounted = true
    
    const loadMetricsSafe = async () => {
      if (!mounted) return
      await loadMetrics()
    }
    
    loadMetricsSafe()
    const interval = setInterval(loadMetricsSafe, 5000) // Refresh every 5 seconds
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
    // Run on mount and refresh every 5s; loadMetrics uses loading only for toast
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchWithAuth, showError])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="card-glass p-6 border-red-500/50">
        <p className="text-red-400">Failed to load system metrics</p>
      </div>
    )
  }

  const MetricCard = ({ title, value, unit, icon, trend, color = 'blue' }: {
    title: string
    value: number | string
    unit?: string
    icon: React.ReactNode
    trend?: string
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-cyan-500',
      green: 'from-emerald-500 to-teal-500',
      yellow: 'from-yellow-500 to-orange-500',
      red: 'from-red-500 to-pink-500',
      purple: 'from-purple-500 to-pink-500'
    }

    return (
      <div className="card-glass p-6 hover:scale-[1.02] transition-transform">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-glow-blue`}>
            {icon}
          </div>
          {trend && (
            <span className={`text-xs px-2 py-1 rounded ${
              trend.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {trend}
            </span>
          )}
        </div>
        <h3 className="text-sm font-medium text-slate-400 mb-1">{title}</h3>
        <div className="text-3xl font-bold text-white">
          {typeof value === 'number' && !isNaN(value) 
            ? value.toLocaleString() 
            : typeof value === 'string' 
              ? value 
              : String(value || 'N/A')}
          {unit && <span className="text-lg text-slate-400 ml-1">{unit}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">System Dashboard</h2>
          <p className="text-slate-400">Real-time system metrics and monitoring</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-emerald-500/30">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-emerald-400">
            {metrics.system_status === 'operational' ? 'ALL SYSTEMS OPERATIONAL' : 'SYSTEM WARNING'}
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Drones"
          value={metrics.active_drones}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
          color="blue"
          trend="+2"
        />
        <MetricCard
          title="Total Detections"
          value={metrics.total_detections}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
          color="green"
        />
        <MetricCard
          title="Active Tracks"
          value={metrics.active_tracks}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          color="purple"
        />
        <MetricCard
          title="Active Users"
          value={metrics.active_users}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          color="yellow"
        />
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-glass p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-400">CPU Usage</span>
                <span className="text-sm font-semibold text-white">{metrics.cpu_usage}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    metrics.cpu_usage > 80 ? 'bg-red-500' : metrics.cpu_usage > 60 ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${metrics.cpu_usage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-400">Memory Usage</span>
                <span className="text-sm font-semibold text-white">{metrics.memory_usage}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    metrics.memory_usage > 80 ? 'bg-red-500' : metrics.memory_usage > 60 ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${metrics.memory_usage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-400">Network Latency</span>
                <span className="text-sm font-semibold text-white">{metrics.network_latency}ms</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    (metrics.network_latency && typeof metrics.network_latency === 'number' && metrics.network_latency > 100)
                      ? 'bg-red-500' 
                      : (metrics.network_latency && typeof metrics.network_latency === 'number' && metrics.network_latency > 50)
                        ? 'bg-yellow-500' 
                        : 'bg-emerald-500'
                  }`}
                  style={{ 
                    width: `${metrics.network_latency && typeof metrics.network_latency === 'number'
                      ? Math.min(100, (metrics.network_latency / 200) * 100)
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-400">Error Rate</span>
                <span className="text-sm font-semibold text-white">{metrics.error_rate}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    metrics.error_rate > 5 ? 'bg-red-500' : metrics.error_rate > 2 ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, metrics.error_rate * 10)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-glass p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-slate-400">System Status</span>
              <span className="text-white font-semibold capitalize">{metrics.system_status}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-slate-400">Uptime</span>
              <span className="text-white font-semibold">{formatUptime(metrics.system_uptime)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-slate-400">API Requests/min</span>
              <span className="text-white font-semibold">{metrics.api_requests_per_minute}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Last Update</span>
              <span className="text-white font-semibold">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatUptime(seconds: number): string {
  const safeSeconds = typeof seconds === 'number' && !isNaN(seconds) && seconds >= 0 ? seconds : 0
  const days = Math.floor(safeSeconds / 86400)
  const hours = Math.floor((safeSeconds % 86400) / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

