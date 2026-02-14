'use client'

import { useState, useMemo } from 'react'
import type { DroneInstance, Detection } from '../types/api'

interface AnalyticsDashboardProps {
  drones: DroneInstance[]
  detections: Detection[]
  mode?: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'
}

export default function AnalyticsDashboard({ drones, detections, mode: _mode }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h')

  // Calculate activeDrones first (used in multiple places)
  const activeDrones = useMemo(() => {
    return drones.filter(d => d.status === 'mission' || d.status === 'ready').length
  }, [drones])

  // Calculate mission drones count
  const missionDronesCount = useMemo(() => {
    return drones.filter(d => d.status === 'mission').length
  }, [drones])

  // Calculate real-time metrics
  const metrics = useMemo(() => {
    const totalDetections = detections.length
    const avgConfidence = detections.length > 0
      ? detections
          .filter(d => d.confidence && typeof d.confidence === 'number')
          .reduce((sum, d) => sum + (d.confidence || 0), 0) / detections.length
      : 0
    
    // Calculate mission success rate (simplified)
    const missionSuccessRate = drones.length > 0
      ? (missionDronesCount / drones.length) * 100
      : 0
    
    // Calculate average battery level
    const avgBattery = drones.length > 0
      ? drones
          .filter(d => d.battery && typeof d.battery === 'number')
          .reduce((sum, d) => sum + (d.battery || 0), 0) / drones.length
      : 0
    
    // Calculate detection rate (detections per minute - simplified)
    const detectionRate = totalDetections / 60 // Assuming 1 hour window
    
    return [
      {
        label: 'Active Drones',
        value: activeDrones,
        trend: 'stable' as const,
        icon: '🚁',
        color: 'blue'
      },
      {
        label: 'Total Detections',
        value: totalDetections,
        trend: 'up' as const,
        change: 12,
        icon: '👁️',
        color: 'green'
      },
      {
        label: 'Avg Confidence',
        value: `${typeof avgConfidence === 'number' && !isNaN(avgConfidence)
          ? (avgConfidence * 100).toFixed(1)
          : '0.0'}%`,
        trend: 'stable' as const,
        icon: '🎯',
        color: 'yellow'
      },
      {
        label: 'Mission Success',
        value: `${typeof missionSuccessRate === 'number' && !isNaN(missionSuccessRate)
          ? missionSuccessRate.toFixed(1)
          : '0.0'}%`,
        trend: 'up' as const,
        change: 2.5,
        icon: '✅',
        color: 'emerald'
      },
      {
        label: 'Avg Battery',
        value: `${typeof avgBattery === 'number' && !isNaN(avgBattery)
          ? avgBattery.toFixed(0)
          : '0'}%`,
        trend: avgBattery > 50 ? 'stable' : 'down',
        change: -5,
        icon: '🔋',
        color: (typeof avgBattery === 'number' && avgBattery > 50) ? 'green' : 'red'
      },
      {
        label: 'Detection Rate',
        value: `${typeof detectionRate === 'number' && !isNaN(detectionRate)
          ? detectionRate.toFixed(1)
          : '0.0'}/min`,
        trend: 'up' as const,
        change: 0.5,
        icon: '📊',
        color: 'purple'
      }
    ]
  }, [drones, detections, activeDrones, missionDronesCount])

  // Performance chart data (simplified)
  const performanceData = useMemo(() => {
    // Generate sample time series data
    const dataPoints = 20
    const data = []
    for (let i = 0; i < dataPoints; i++) {
      data.push({
        time: new Date(Date.now() - (dataPoints - i) * 60000).toLocaleTimeString(),
        detections: Math.floor(Math.random() * 10) + 5,
        confidence: 0.7 + Math.random() * 0.2,
        drones: activeDrones
      })
    }
    return data
  }, [activeDrones])

  // Calculate confidence distribution from detections
  const confidenceDistribution = useMemo(() => {
    const ranges = [
      { range: '90-100%', min: 0.9, max: 1.0, color: 'green' },
      { range: '75-90%', min: 0.75, max: 0.9, color: 'yellow' },
      { range: '50-75%', min: 0.5, max: 0.75, color: 'orange' },
      { range: '0-50%', min: 0.0, max: 0.5, color: 'red' },
    ]

    return ranges.map(range => {
      const count = detections.filter(d => {
        const conf = d.confidence || 0
        return conf >= range.min && conf < range.max
      }).length

      return {
        ...range,
        count
      }
    })
  }, [detections])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Real-Time Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '1h' | '6h' | '24h' | '7d')}
          className="glass border border-white/20 rounded-lg px-4 py-2 text-sm text-white"
        >
          <option value="1h">Last Hour</option>
          <option value="6h">Last 6 Hours</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="card-glass p-4 hover:scale-105 transition-transform cursor-pointer"
            onClick={() => {
              // Metric selected (for future use)
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{metric.icon}</span>
              {metric.trend && (
                <span className={`text-xs ${
                  metric.trend === 'up' ? 'text-green-400' :
                  metric.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
            <div className="text-xs text-slate-400">{metric.label}</div>
            {metric.change && (
              <div className={`text-xs mt-1 ${
                metric.change > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Detection Trends */}
        <div className="card-glass p-6">
          <h3 className="text-lg font-bold text-white mb-4">Detection Trends</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {performanceData.map((point, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t transition-all hover:opacity-80"
                  style={{ height: `${(point.detections / 15) * 100}%` }}
                  title={`${point.detections} detections`}
                />
                {i % 5 === 0 && (
                  <span className="text-xs text-slate-400 mt-2 transform -rotate-45 origin-left">
                    {point.time ? String(point.time).slice(0, 5) : '--:--'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="card-glass p-6">
          <h3 className="text-lg font-bold text-white mb-4">Confidence Distribution</h3>
          <div className="space-y-3">
            {confidenceDistribution.map((item, i) => {
              const counts = confidenceDistribution.map(r => r.count)
              const maxCount = Math.max(...counts, 1) // Ensure at least 1 to avoid division by zero
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0
            
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-slate-300 w-16">{item.range}</span>
                  <div className="flex-1 glass border border-white/10 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        item.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-400' :
                        item.color === 'yellow' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                        item.color === 'orange' ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                        'bg-gradient-to-r from-red-500 to-red-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                    />
                  </div>
                  <span className="text-sm text-white font-semibold w-12 text-right">{item.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Drone Status Overview */}
      <div className="card-glass p-6">
        <h3 className="text-lg font-bold text-white mb-4">Drone Status Overview</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {drones.map((drone) => (
            <div key={drone.id} className="glass border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{drone.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  drone.status === 'mission' ? 'bg-green-500/20 text-green-400' :
                  drone.status === 'ready' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {drone.status}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Battery:</span>
                  <span className="text-white">{drone.battery || 0}%</span>
                </div>
                {drone.position && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Altitude:</span>
                    <span className="text-white">{drone.position.alt.toFixed(0)}m</span>
                  </div>
                )}
                {drone.speed !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Speed:</span>
                    <span className="text-white">
                      {drone.speed && typeof drone.speed === 'number' && !isNaN(drone.speed)
                        ? drone.speed.toFixed(1)
                        : '0.0'}m/s
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="card-glass p-6">
        <h3 className="text-lg font-bold text-white mb-4">Performance Indicators</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-slate-400 mb-2">System Efficiency</div>
            <div className="relative w-full h-4 glass border border-white/10 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: '87%' }} />
            </div>
            <div className="text-right text-sm text-white mt-1">87%</div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-2">Detection Accuracy</div>
            <div className="relative w-full h-4 glass border border-white/10 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: '92%' }} />
            </div>
            <div className="text-right text-sm text-white mt-1">92%</div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-2">Mission Success Rate</div>
            <div className="relative w-full h-4 glass border border-white/10 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '95%' }} />
            </div>
            <div className="text-right text-sm text-white mt-1">95%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
