'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useApi } from '../lib/api'
import MultiDroneVideoManager from '../components/MultiDroneVideoManager'
import AIDroneCommandInterface from '../components/AIDroneCommandInterface'
import CesiumMissionView from '../components/CesiumMissionView'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import VoiceControl from '../components/VoiceControl'
import AIChatInterface from '../components/AIChatInterface'
import ManualControlPanel from '../components/ManualControlPanel'
import AutonomousModeSelector from '../components/AutonomousModeSelector'
import LLMCommandInterface from '../components/LLMCommandInterface'
import ExplainableAIDashboard from '../components/ExplainableAIDashboard'
import GestureControl from '../components/GestureControl'
import VRMissionControl from '../components/VRMissionControl'
import MultiScreenControl from '../components/MultiScreenControl'
import { ErrorBoundary } from '../components/ErrorBoundary'
import ToastContainer from '../components/ToastContainer'
import QuickActions from '../components/QuickActions'
import { useToast } from '../hooks/useToast'
import { useCivilianRealtime } from '../hooks/useCivilianRealtime'
import { logger } from '../lib/logger'
import { IconPlane } from '../components/UIcons'
import type { ApiStatus, Waypoint, Detection, RoutePlan, DroneInstance } from '../types/api'

export default function PilotPage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAutonomy, setSelectedAutonomy] = useState<string>('manual')
  const [detections, _setDetections] = useState<Detection[]>([])
  const [drones, _setDrones] = useState<DroneInstance[]>([])
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [aiAdvice, setAiAdvice] = useState<string>('')
  const [routePlan, _setRoutePlan] = useState<RoutePlan | null>(null)
  const [activeTab, setActiveTab] = useState<'control' | 'mission' | 'monitoring' | 'advanced'>('control')
  const [rightColumnTab, setRightColumnTab] = useState<'video' | 'analytics' | 'detections'>('video')
  const { fetchWithAuth } = useApi()
  const { toasts, removeToast, success } = useToast()
  
  // WebSocket real-time updates
  const realtimeHookResult = useCivilianRealtime({
    drones,
    detections,
    routePlan,
    waypoints,
    aiAdvice,
  })
  
  const wsConnected = realtimeHookResult?.isConnected || false

  // Check API status on mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const status = await fetchWithAuth('/api/status') as ApiStatus
        setApiStatus(status)
      } catch (error) {
        logger.warn('Could not fetch API status:', error)
        setApiStatus(null)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      checkApiStatus()
    }, 100)

    return () => clearTimeout(timer)
    // Run once on mount; /api/status is handled by app/api/status/route.ts and always returns 200
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts for tabs
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName || '')) {
        if (e.key === '1') {
          e.preventDefault()
          setActiveTab('control')
        } else if (e.key === '2') {
          e.preventDefault()
          setActiveTab('mission')
        } else if (e.key === '3') {
          e.preventDefault()
          setActiveTab('monitoring')
        } else if (e.key === '4') {
          e.preventDefault()
          setActiveTab('advanced')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] text-readable">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dji-500/50 border-t-dji-400 rounded-full animate-spin mx-auto mb-4" aria-hidden />
          <p className="text-slate-300 font-futuristic">Loading Pilot Control Center...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0a0f1a] text-readable">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1520] to-[#0f1825]" />
        <div className="absolute inset-0 bg-dji-500/5 pointer-events-none" />
        {/* Header */}
        <header className="sticky top-0 z-50 glass-dji border-b border-dji-500/30 backdrop-blur-xl relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/pilot" className="flex items-center gap-3 hover:opacity-90 transition-opacity" aria-label="Pilot Control Center home">
                  <div className="w-10 h-10 bg-gradient-to-br from-dji-500 to-dji-600 rounded-xl flex items-center justify-center border border-dji-400/40 shadow-[0_0_16px_rgba(9,113,206,0.3)]">
                    <IconPlane className="w-5 h-5 text-white" aria-hidden />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-100 font-futuristic">Pilot Control Center</div>
                    <div className="text-xs text-slate-400 font-futuristic">Professional Operations</div>
                  </div>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/select-role" className="btn-dji-secondary text-xs py-2 px-3">Switch role</Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="relative layout-dashboard py-4 sm:py-6">
          {/* Status Bar */}
            <div className="mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 glass-dji rounded-xl border border-dji-500/20" role="status" aria-live="polite">
              <div className={`w-2 h-2 rounded-full ${apiStatus?.running ? 'bg-dji-400 animate-pulse' : 'bg-red-400'}`} aria-hidden />
              <span className="text-sm text-slate-300 font-futuristic">
                API: {apiStatus?.running ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass-dji rounded-xl border border-dji-500/20" role="status">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-dji-400 animate-pulse' : 'bg-amber-400'}`} aria-hidden />
              <span className="text-sm text-slate-300 font-futuristic">
                WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {drones.length > 0 && (
              <div className="px-4 py-2 glass-dji rounded-xl border border-dji-500/20">
                <span className="text-sm text-slate-300 font-futuristic">
                  Drones: <span className="text-dji-400 font-semibold">{drones.length}</span>
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <QuickActions role="pilot" />

          {/* Main Tabs */}
          <div className="mb-4 sm:mb-6 animate-fade-in sticky top-[64px] z-30 bg-slate-900/95 backdrop-blur-xl border-b border-dji-500/20 pb-3 sm:pb-4 shadow-lg pt-3 sm:pt-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {[
                { id: 'control', label: 'Flight Control', shortcut: '1', description: 'Manual and autonomous flight control' },
                { id: 'mission', label: 'Mission Planning', shortcut: '2', description: 'Plan and execute missions' },
                { id: 'monitoring', label: 'Monitoring', shortcut: '3', description: 'Video feeds, analytics, and telemetry' },
                { id: 'advanced', label: 'Advanced', shortcut: '4', description: 'AI, voice, gesture, and VR controls' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap touch-target font-futuristic text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-dji-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                    activeTab === tab.id
                      ? 'nav-dji-active text-slate-100'
                      : 'nav-dji-inactive text-slate-400'
                  }`}
                  title={`${tab.description} (Press ${tab.shortcut})`}
                  aria-pressed={activeTab === tab.id}
                  aria-label={`${tab.label}. ${tab.description}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'control' && (
                <div className="space-y-6">
                  <ManualControlPanel
                    waypoints={waypoints}
                    onWaypointsChange={setWaypoints}
                    onExecute={() => {
                      if (waypoints.length > 0) {
                        success(`Executing mission with ${waypoints.length} waypoints`)
                      }
                    }}
                  />
                  <AutonomousModeSelector
                    mode="filming"
                    selectedMode={selectedAutonomy}
                    onSelect={(mode) => setSelectedAutonomy(mode.id)}
                  />
                  {drones.length > 0 && (
                    <AIDroneCommandInterface
                      mode="filming"
                      drones={drones}
                      onCommandExecuted={() => {
                        success('Command executed successfully')
                      }}
                    />
                  )}
                </div>
              )}

              {activeTab === 'mission' && (
                <div className="space-y-6">
                  <CesiumMissionView
                    waypoints={waypoints}
                    drones={drones}
                    onWaypointAdd={(wp) => {
                      const newWaypoints = [...waypoints, wp]
                      setWaypoints(newWaypoints)
                    }}
                    onWaypointUpdate={(wp) => {
                      const newWaypoints = waypoints.map(w => w.id === wp.id ? wp : w)
                      setWaypoints(newWaypoints)
                    }}
                    onWaypointDelete={(id) => {
                      const newWaypoints = waypoints.filter(w => w.id !== id)
                      setWaypoints(newWaypoints)
                    }}
                  />
                  <LLMCommandInterface
                    mode="filming"
                    availableDrones={drones.map(d => d.id)}
                    onCommandProcessed={(cmd) => {
                      if (cmd.action) {
                        success(`Command processed: ${cmd.action}`)
                      }
                    }}
                  />
                </div>
              )}

              {activeTab === 'monitoring' && (
                <div className="space-y-6">
                  <MultiDroneVideoManager mode="filming" initialDrones={drones} />
                  <AnalyticsDashboard drones={drones} detections={detections} mode="filming" />
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <AIChatInterface
                    mode="filming"
                    onRouteGenerated={(route) => {
                      if (route.waypoints) {
                        const newWaypoints = route.waypoints.map((wp, idx) => ({
                          id: `wp_${Date.now()}_${idx}`,
                          lat: wp.lat,
                          lon: wp.lon,
                          alt: wp.alt ?? 100,
                          name: `Waypoint ${idx + 1}`,
                        }))
                        setWaypoints(newWaypoints)
                      }
                    }}
                    onAdviceReceived={setAiAdvice}
                    waypointsCount={waypoints.length}
                    voiceReplyEnabled={true}
                  />
                  <ExplainableAIDashboard />
                  <VoiceControl />
                  <GestureControl />
                  <VRMissionControl drones={drones} waypoints={waypoints} />
                  <MultiScreenControl />
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card-dji p-4 border-2 border-dji-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-4" role="tablist" aria-label="Right panel tabs">
                  {[
                    { id: 'video' as const, label: 'Video' },
                    { id: 'analytics' as const, label: 'Analytics' },
                    { id: 'detections' as const, label: 'Detections' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={rightColumnTab === t.id}
                      onClick={() => setRightColumnTab(t.id)}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all touch-target font-futuristic focus:outline-none focus-visible:ring-2 focus-visible:ring-dji-500 ${
                        rightColumnTab === t.id
                          ? 'bg-dji-500/20 text-dji-400 border border-dji-500/40'
                          : 'text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {rightColumnTab === 'video' && (
                  <div className="space-y-4">
                    <MultiDroneVideoManager mode="filming" initialDrones={drones} />
                  </div>
                )}

                {rightColumnTab === 'analytics' && (
                  <div>
                    <AnalyticsDashboard drones={drones} detections={detections} mode="filming" />
                  </div>
                )}

                {rightColumnTab === 'detections' && (
                  <div className="space-y-2" role="tabpanel" aria-label="Detections panel">
                    {detections.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-8 font-futuristic">No detections yet. Start a mission to see results.</p>
                    ) : (
                      detections.map((detection, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">{detection.label || 'Unknown'}</span>
                            {detection.confidence && (
                              <span className="text-xs text-slate-400">
                                {(detection.confidence * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          {detection.distance && (
                            <p className="text-xs text-slate-400">Distance: {detection.distance}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </ErrorBoundary>
  )
}
