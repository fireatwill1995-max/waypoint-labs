'use client'

import { useEffect, useState, memo } from 'react'
import { useApi } from '../lib/api'
import { logger } from '../lib/logger'
import type { AdvancedFeaturesStatus, AntiJammingStatus, AntiTrackingStatus, AutoEvadeStatus, TrackCorrectionStatus, MultiDroneStatus, AIEngineStatus } from '../types/api'

interface FeatureDetail {
  anti_jamming?: AntiJammingStatus
  anti_tracking?: AntiTrackingStatus
  auto_evade?: AutoEvadeStatus
  track_correction?: TrackCorrectionStatus
  multi_drone?: MultiDroneStatus
  ai_engine?: AIEngineStatus
}

function AdvancedFeaturesPanel() {
  const [summary, setSummary] = useState<AdvancedFeaturesStatus | null>(null)
  const [details, setDetails] = useState<FeatureDetail>({})
  const [loading, setLoading] = useState(true)
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null)
  const { fetchWithAuth } = useApi()

  useEffect(() => {
    let mounted = true
    let abortController: AbortController | null = null

    const loadData = async () => {
      // Cancel previous request if still pending
      if (abortController) {
        abortController.abort()
        abortController = null
      }
      
      // Create new abort controller for this request
      abortController = new AbortController()
      const signal = abortController.signal

      try {
        // Pass signal in options for request cancellation
        const fetchOptions = { signal }
        const [summaryData, antiJamming, antiTracking, autoEvade, trackCorrection, multiDrone, aiEngine] = await Promise.all([
          fetchWithAuth('/api/advanced/features/summary', fetchOptions) as Promise<AdvancedFeaturesStatus>,
          fetchWithAuth('/api/advanced/anti-jamming/status', fetchOptions) as Promise<AntiJammingStatus>,
          fetchWithAuth('/api/advanced/anti-tracking/status', fetchOptions) as Promise<AntiTrackingStatus>,
          fetchWithAuth('/api/advanced/auto-evade/status', fetchOptions) as Promise<AutoEvadeStatus>,
          fetchWithAuth('/api/advanced/track-correction/status', fetchOptions) as Promise<TrackCorrectionStatus>,
          fetchWithAuth('/api/advanced/multi-drone/status', fetchOptions) as Promise<MultiDroneStatus>,
          fetchWithAuth('/api/advanced/ai-engine/status', fetchOptions) as Promise<AIEngineStatus>
        ])

        // Check if request was cancelled
        if (signal.aborted) {
          return
        }

        if (mounted) {
          setSummary(summaryData)
          setDetails({
            anti_jamming: antiJamming,
            anti_tracking: antiTracking,
            auto_evade: autoEvade,
            track_correction: trackCorrection,
            multi_drone: multiDrone,
            ai_engine: aiEngine
          })
          setLoading(false)
        }
      } catch (error) {
        // Ignore abort errors - they're expected when component unmounts or new request starts
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        
        // Log other errors
        if (mounted) {
          logger.error('Failed to load advanced features:', error)
        }
        if (mounted) {
          setLoading(false)
        }
      } finally {
        // Clear abort controller after request completes
        if (!signal.aborted) {
          abortController = null
        }
      }
    }

    // Small delay before checking status
    const timer = setTimeout(() => {
      loadData()
    }, 100)

    const interval = setInterval(() => {
      if (mounted) {
        loadData()
      }
    }, 5000) // Refresh every 5 seconds
    
    return () => {
      mounted = false
      clearTimeout(timer)
      clearInterval(interval)
      // Cancel any pending request
      if (abortController) {
        abortController.abort()
        abortController = null
      }
    }
  }, [fetchWithAuth]) // Include fetchWithAuth in dependencies

  if (loading) {
    return (
      <div className="card-glass p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="card-glass p-6 border-red-500/50">
        <p className="text-red-400">Failed to load advanced features status</p>
      </div>
    )
  }

  const FeatureCard = ({ 
    title, 
    icon, 
    status, 
    enabled, 
    onExpand,
    isExpanded,
    children 
  }: {
    title: string
    icon: string
    status: string
    enabled: boolean
    onExpand: () => void
    isExpanded: boolean
    children?: React.ReactNode
  }) => (
    <div className="card-glass p-4 border border-white/10 hover:border-blue-500/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-xs text-slate-400">
              {enabled ? (
                <span className="text-emerald-400">● Enabled</span>
              ) : (
                <span className="text-red-400">● Disabled</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
          }`}>
            {status.toUpperCase()}
          </span>
          <button
            onClick={onExpand}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>
      {isExpanded && children && (
        <div className="mt-3 pt-3 border-t border-white/10">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Advanced Features</h2>
        <div className="text-sm text-slate-400">
          Auto-refresh: 5s
        </div>
      </div>

      <FeatureCard
        title="Anti-Jamming System"
        icon="📡"
        status={summary.anti_jamming.status}
        enabled={summary.anti_jamming.enabled}
        onExpand={() => setExpandedFeature(expandedFeature === 'anti_jamming' ? null : 'anti_jamming')}
        isExpanded={expandedFeature === 'anti_jamming'}
      >
        {details.anti_jamming && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Frequency:</span>
                <span className="text-white ml-2">{details.anti_jamming.frequency_hopping?.current_frequency} MHz</span>
              </div>
              <div>
                <span className="text-slate-400">Hop Rate:</span>
                <span className="text-white ml-2">{details.anti_jamming.frequency_hopping?.hop_rate} Hz</span>
              </div>
              <div>
                <span className="text-slate-400">Comm Quality:</span>
                <span className="text-white ml-2">
                  {details.anti_jamming?.communication_quality && typeof details.anti_jamming.communication_quality === 'number'
                    ? (details.anti_jamming?.communication_quality && typeof details.anti_jamming.communication_quality === 'number' && !isNaN(details.anti_jamming.communication_quality)
                      ? details.anti_jamming.communication_quality * 100
                      : 0).toFixed(1)
                    : '0.0'}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">Mitigation Rate:</span>
                <span className="text-white ml-2">
                  {details.anti_jamming?.mitigation_success_rate && typeof details.anti_jamming.mitigation_success_rate === 'number' && !isNaN(details.anti_jamming.mitigation_success_rate)
                    ? (details.anti_jamming.mitigation_success_rate * 100).toFixed(1)
                    : '0.0'}%
                </span>
              </div>
            </div>
            {details.anti_jamming.jamming_detected && (
              <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-400">
                ⚠️ Jamming detected - Countermeasures active
              </div>
            )}
          </div>
        )}
      </FeatureCard>

      <FeatureCard
        title="Anti-Tracking & Stealth"
        icon="🥷"
        status={summary.anti_tracking.status}
        enabled={summary.anti_tracking.enabled}
        onExpand={() => setExpandedFeature(expandedFeature === 'anti_tracking' ? null : 'anti_tracking')}
        isExpanded={expandedFeature === 'anti_tracking'}
      >
        {details.anti_tracking && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">RCS Reduction:</span>
                <span className="text-white ml-2">
                  {details.anti_tracking?.radar_cross_section_reduction && typeof details.anti_tracking.radar_cross_section_reduction === 'number'
                    ? (details.anti_tracking?.radar_cross_section_reduction && typeof details.anti_tracking.radar_cross_section_reduction === 'number' && !isNaN(details.anti_tracking.radar_cross_section_reduction)
                      ? details.anti_tracking.radar_cross_section_reduction * 100
                      : 0).toFixed(0)
                    : '0'}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">Thermal Reduction:</span>
                <span className="text-white ml-2">
                  {details.anti_tracking?.thermal_signature_reduction && typeof details.anti_tracking.thermal_signature_reduction === 'number'
                    ? (details.anti_tracking.thermal_signature_reduction * 100).toFixed(0)
                    : '0'}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">Tracking Events:</span>
                <span className="text-white ml-2">{details.anti_tracking.tracking_events_detected}</span>
              </div>
              <div>
                <span className="text-slate-400">Evasion Success:</span>
                <span className="text-white ml-2">{(details.anti_tracking.evasion_success_rate * 100).toFixed(0)}%</span>
              </div>
            </div>
            {details.anti_tracking.stealth_mode && (
              <div className="mt-2 p-2 bg-blue-500/20 border border-blue-500/50 rounded text-blue-400">
                🥷 Stealth mode active
              </div>
            )}
          </div>
        )}
      </FeatureCard>

      <FeatureCard
        title="Auto-Evade System"
        icon="🛡️"
        status={summary.auto_evade.status}
        enabled={summary.auto_evade.enabled}
        onExpand={() => setExpandedFeature(expandedFeature === 'auto_evade' ? null : 'auto_evade')}
        isExpanded={expandedFeature === 'auto_evade'}
      >
        {details.auto_evade && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Active Threats:</span>
                <span className="text-white ml-2">{details.auto_evade.active_threats}</span>
              </div>
              <div>
                <span className="text-slate-400">Evasion Success:</span>
                <span className="text-white ml-2">{(details.auto_evade.evasion_success_rate * 100).toFixed(0)}%</span>
              </div>
            </div>
            {details.auto_evade.active_threats > 0 && (
              <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-400">
                ⚠️ {details.auto_evade.active_threats} active threat(s) detected
              </div>
            )}
          </div>
        )}
      </FeatureCard>

      <FeatureCard
        title="Auto-Track Correction"
        icon="🎯"
        status={summary.track_correction.status}
        enabled={summary.track_correction.enabled}
        onExpand={() => setExpandedFeature(expandedFeature === 'track_correction' ? null : 'track_correction')}
        isExpanded={expandedFeature === 'track_correction'}
      >
        {details.track_correction && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Track Quality:</span>
                <span className="text-white ml-2">
                  {details.track_correction?.tracking_quality && typeof details.track_correction.tracking_quality === 'number' && !isNaN(details.track_correction.tracking_quality)
                    ? (details.track_correction.tracking_quality * 100).toFixed(1)
                    : '0.0'}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">Corrections:</span>
                <span className="text-white ml-2">{details.track_correction.corrections_applied}</span>
              </div>
              <div>
                <span className="text-slate-400">Algorithm:</span>
                <span className="text-white ml-2">{details.track_correction.prediction_algorithm}</span>
              </div>
              <div>
                <span className="text-slate-400">Min Confidence:</span>
                <span className="text-white ml-2">{details.track_correction.min_confidence}</span>
              </div>
            </div>
            {details.track_correction.interference_detected && (
              <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400">
                ⚠️ Interference detected - Using backup sensors
              </div>
            )}
          </div>
        )}
      </FeatureCard>

      <FeatureCard
        title="Multi-Drone Management"
        icon="🚁"
        status={summary.multi_drone.status}
        enabled={summary.multi_drone.enabled}
        onExpand={() => setExpandedFeature(expandedFeature === 'multi_drone' ? null : 'multi_drone')}
        isExpanded={expandedFeature === 'multi_drone'}
      >
        {details.multi_drone && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Active Drones:</span>
                <span className="text-white ml-2">{details.multi_drone.active_drones} / {details.multi_drone.max_drones}</span>
              </div>
              <div>
                <span className="text-slate-400">Coordination:</span>
                <span className="text-white ml-2">{details.multi_drone.coordination_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
            {details.multi_drone?.drones && Array.isArray(details.multi_drone.drones) && details.multi_drone.drones.length > 0 && (
              <div className="mt-2 space-y-1">
                {details.multi_drone.drones.map((drone) => (
                  <div key={drone.id} className="p-2 bg-slate-800/50 rounded text-xs">
                    <div className="flex justify-between">
                      <span className="text-white">{drone.name}</span>
                      <span className={`px-2 py-0.5 rounded ${
                        drone.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {drone.status}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-1">
                      Battery: {((drone.battery || 0) * 100).toFixed(0)}% | Multi-Role
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </FeatureCard>

      <FeatureCard
        title="Advanced AI Engine"
        icon="🤖"
        status={summary.ai_engine.status}
        enabled={summary.ai_engine.enabled}
        onExpand={() => setExpandedFeature(expandedFeature === 'ai_engine' ? null : 'ai_engine')}
        isExpanded={expandedFeature === 'ai_engine'}
      >
        {details.ai_engine && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Model:</span>
                <span className="text-white ml-2">{details.ai_engine.model_type}</span>
              </div>
              <div>
                <span className="text-slate-400">Confidence:</span>
                <span className="text-white ml-2">{details.ai_engine.confidence_threshold}</span>
              </div>
              <div>
                <span className="text-slate-400">Decisions:</span>
                <span className="text-white ml-2">{details.ai_engine.decisions_made}</span>
              </div>
              <div>
                <span className="text-slate-400">Learning:</span>
                <span className="text-white ml-2">{details.ai_engine.learning_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div>
                <span className="text-slate-400">Risk Tolerance:</span>
                <span className="text-white ml-2">{details.ai_engine.risk_tolerance}</span>
              </div>
              <div>
                <span className="text-slate-400">Aggressiveness:</span>
                <span className="text-white ml-2">{details.ai_engine.aggressiveness}</span>
              </div>
            </div>
          </div>
        )}
      </FeatureCard>
    </div>
  )
}

export default memo(AdvancedFeaturesPanel)

