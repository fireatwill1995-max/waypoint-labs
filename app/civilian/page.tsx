'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../lib/api'
import { useRouter } from 'next/navigation'
import MultiDroneVideoManager from '../components/MultiDroneVideoManager'
import AIDroneCommandInterface from '../components/AIDroneCommandInterface'
import CesiumMissionView from '../components/CesiumMissionView'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import VoiceControl from '../components/VoiceControl'
import AIChatInterface from '../components/AIChatInterface'
import OperationOptions from '../components/OperationOptions'
import FishDetectionPanel from '../components/FishDetectionPanel'
import FishingAnalyticsDashboard from '../components/FishingAnalyticsDashboard'
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
import { useDemoAuth } from '../lib/demoAuth'
import { DemoUserButton } from '../components/DemoAuth'
import { IconClipboard, IconChat, IconGamepad, IconChip, IconChart, IconCog, IconCattle, IconCamera, IconUsers, IconFish, IconVideo, IconSearch, IconTarget, IconMining } from '../components/UIcons'
import MiningDashboard from '../components/MiningDashboard'
import MissionPlanningHub from '../components/MissionPlanningHub'
import type { ApiStatus, Waypoint, Detection, OperationOption, RoutePlan, DroneInstance } from '../types/api'

const MODE_DETECTION_LABELS: Record<string, string> = {
  cattle: '🐄 Cattle',
  hunting: '🦌 Wildlife',
  filming: '🎬 Filming',
  fishing: '🐟 Fishing',
  mining: '⛏️ Mining',
  people: '👥 People',
}

export default function CivilianPage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining' | null>(null)
  const [selectedOperation, setSelectedOperation] = useState<OperationOption | null>(null)
  const [selectedAutonomy, setSelectedAutonomy] = useState<string>('manual')
  const [location, setLocation] = useState({ lat: '', lon: '' })
  const [destination, setDestination] = useState({ lat: '', lon: '' })
  const [detections, setDetections] = useState<Detection[]>([])
  const [drones, setDrones] = useState<DroneInstance[]>([])
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [aiAdvice, setAiAdvice] = useState<string>('')
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null)
  const [activeTab, setActiveTab] = useState<'plan' | 'chat' | 'manual' | 'autonomous' | 'monitoring' | 'advanced'>('plan')
  const [rightColumnTab, setRightColumnTab] = useState<'video' | 'analytics' | 'detections'>('video')
  const [aiLog, setAiLog] = useState<string[]>([])
  const [aiLogOpen, setAiLogOpen] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [voiceTranscriptForChat, setVoiceTranscriptForChat] = useState<string | null>(null)
  const { fetchWithAuth } = useApi()
  const router = useRouter()
  const { toasts, removeToast, success, error: showError } = useToast()
  
  const demoAuth = useDemoAuth()
  
  // WebSocket real-time updates
  const realtimeHookResult = useCivilianRealtime({
    drones,
    detections,
    routePlan,
    waypoints,
    aiAdvice,
  })
  
  const realtimeData = realtimeHookResult?.data || {
    drones: [],
    detections: [],
    routePlan: null,
    waypoints: [],
    aiAdvice: '',
    telemetry: {},
  }
  const wsConnected = realtimeHookResult?.isConnected || false
  const updateRealtimeDrones = realtimeHookResult?.updateDrones || (() => {})
  const updateRealtimeDetections = realtimeHookResult?.updateDetections || (() => {})
  const updateRealtimeWaypoints = realtimeHookResult?.updateWaypoints || (() => {})

  // Keyboard shortcuts for tabs
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Number keys 1-4 for tabs (only when not typing in input)
      if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName || '')) {
        if (e.key === '1') {
          e.preventDefault()
          setActiveTab('plan')
        } else if (e.key === '2') {
          e.preventDefault()
          setActiveTab('chat')
        } else if (e.key === '3') {
          e.preventDefault()
          setActiveTab('manual')
        } else if (e.key === '4') {
          e.preventDefault()
          setActiveTab('autonomous')
        } else if (e.key === '5') {
          e.preventDefault()
          setActiveTab('monitoring')
        } else if (e.key === '6') {
          e.preventDefault()
          setActiveTab('advanced')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    let role: string | null = null
    try {
      if (typeof window !== 'undefined') {
        role = localStorage.getItem('userRole')
        // Validate role value to prevent XSS
        if (role && !['civilian', 'military', 'admin'].includes(role)) {
          role = null
          localStorage.removeItem('userRole')
        }
      }
    } catch (error) {
      // localStorage may be unavailable
    }
    if (role !== 'civilian') {
      router.push('/select-role')
      return
    }

    const checkApiStatus = async () => {
      try {
        const status = await fetchWithAuth('/api/status') as ApiStatus
        setApiStatus(status)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect to API server'
        const isOfflineError = err instanceof Error && (err as Error & { isOfflineError?: boolean }).isOfflineError
        // Only show error toast if it's not an offline error (we'll show it in UI instead)
        if (!isOfflineError && !errorMessage.includes('Backend server is not running')) {
          showError(errorMessage)
        }
        // Set apiStatus to null to indicate offline
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

  // Helper function to deep compare arrays/objects (more efficient than JSON.stringify)
  const arraysEqual = useCallback((a: unknown[], b: unknown[]): boolean => {
    // Handle null/undefined cases
    if (!a || !b) return a === b
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false
    return a.every((val, idx) => {
      const bVal = b[idx]
      if (Array.isArray(val) && Array.isArray(bVal)) {
        return arraysEqual(val, bVal)
      }
      return val === bVal
    })
  }, [])

  // Sync WebSocket updates with local state (only update if different to prevent loops)
  useEffect(() => {
    try {
      if (realtimeData?.drones && Array.isArray(realtimeData.drones) && realtimeData.drones.length > 0) {
        // Only update if the arrays are actually different
        if (!arraysEqual(realtimeData.drones, drones)) {
          setDrones(realtimeData.drones)
        }
      }
    } catch (error) {
      logger.error('Error syncing drones:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeData?.drones, arraysEqual])

  useEffect(() => {
    try {
      if (realtimeData?.detections && Array.isArray(realtimeData.detections)) {
        // Only update if the arrays are actually different
        const shouldUpdate = !arraysEqual(realtimeData.detections, detections) && 
                            (realtimeData.detections.length > 0 || detections.length === 0)
        if (shouldUpdate) {
          setDetections(realtimeData.detections)
        }
      }
    } catch (error) {
      logger.error('Error syncing detections:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeData?.detections, arraysEqual])

  useEffect(() => {
    try {
      if (realtimeData?.routePlan) {
        // Only update if actually different (simple reference check for objects)
        if (realtimeData.routePlan !== routePlan) {
          setRoutePlan(realtimeData.routePlan)
        }
      }
    } catch (error) {
      logger.error('Error syncing route plan:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeData?.routePlan])

  useEffect(() => {
    try {
      if (realtimeData?.waypoints && Array.isArray(realtimeData.waypoints) && realtimeData.waypoints.length > 0) {
        // Only update if the arrays are actually different
        if (!arraysEqual(realtimeData.waypoints, waypoints)) {
          setWaypoints(realtimeData.waypoints)
        }
      }
    } catch (error) {
      logger.error('Error syncing waypoints:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeData?.waypoints, arraysEqual])

  useEffect(() => {
    try {
      if (realtimeData?.aiAdvice && typeof realtimeData.aiAdvice === 'string' && realtimeData.aiAdvice !== aiAdvice) {
        setAiAdvice(realtimeData.aiAdvice)
      }
    } catch (error) {
      logger.error('Error syncing AI advice:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeData?.aiAdvice])

  const handleModeSelect = async (mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining') => {
    setSelectedMode(mode)
    setSelectedOperation(null)
    setRoutePlan(null)
    setAiAdvice('')
    setLocation({ lat: '', lon: '' })
    setDestination({ lat: '', lon: '' })
    setWaypoints([])
    setActiveTab('plan') // Always start with plan tab
    if (mode !== 'filming' && mode !== 'fishing' && mode !== 'mining') {
      try {
        const response = await fetchWithAuth(`/api/civilian/detect?mode=${mode}`) as { detections?: Detection[] }
        setDetections(response.detections || [])
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start detection'
        // Handle 401 errors gracefully - show user-friendly message
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          showError('Authentication required. Please sign in again or check your session.')
        } else {
          showError(errorMessage || 'Failed to start detection. The video feed may still work.')
        }
        // Don't block UI if API fails - show empty detections
        setDetections([])
      }
    } else {
      setDetections([])
    }
  }

  const handleOperationSelect = async (operation: OperationOption) => {
    setSelectedOperation(operation)
    setRoutePlan(null)
    setAiAdvice('')
    setLocation({ lat: '', lon: '' })
    setDestination({ lat: '', lon: '' })
    // Here you would trigger the specific operation based on the selection
  }

  const appendAiLog = (entry: string) => {
    const stamp = new Date().toLocaleTimeString()
    setAiLog((prev) => [...prev, `[${stamp}] ${entry}`])
  }

  const requestAiRouteCleanup = async () => {
    if (!selectedMode || waypoints.length === 0) {
      showError('Add waypoints and select a mode before asking AI to clean the route.')
      return
    }
    setAiBusy(true)
    appendAiLog('Requesting AI route cleanup...')
    try {
      const res = await fetchWithAuth('/api/civilian/route/cleanup', {
        method: 'POST',
        body: JSON.stringify({ mode: selectedMode, waypoints, destination }),
      }) as { route?: RoutePlan; waypoints?: Waypoint[]; reason?: string } | null
      if (res?.route) setRoutePlan(res.route)
      if (res?.waypoints) setWaypoints(res.waypoints)
      if (res?.reason) appendAiLog(res.reason)
      appendAiLog('AI route cleanup completed.')
      success('Route cleanup completed successfully!')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Route cleanup failed'
      appendAiLog(`Route cleanup failed: ${errorMessage}`)
      showError(errorMessage)
    } finally {
      setAiBusy(false)
    }
  }

  const requestAiRecommendation = async () => {
    if (!selectedMode) {
      showError('Select a mode first.')
      return
    }
    setAiBusy(true)
    appendAiLog('Requesting AI route recommendation...')
    try {
      const res = await fetchWithAuth('/api/civilian/route/recommend', {
        method: 'POST',
        body: JSON.stringify({
          mode: selectedMode,
          operation: selectedOperation?.id,
          location,
          destination,
        }),
      }) as { route?: RoutePlan; waypoints?: Waypoint[]; reason?: string } | null
      if (res?.route) setRoutePlan(res.route)
      if (res?.waypoints) setWaypoints(res.waypoints)
      if (res?.reason) appendAiLog(res.reason)
      appendAiLog('AI recommendation received.')
      success('AI recommendation received!')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Recommendation failed'
      appendAiLog(`Recommendation failed: ${errorMessage}`)
      showError(errorMessage)
    } finally {
      setAiBusy(false)
    }
  }

  const requestAiTakeover = async () => {
    if (!selectedMode || waypoints.length === 0) {
      showError('Select a mode and add waypoints before AI takeover.')
      return
    }
    setAiBusy(true)
    appendAiLog('Requesting AI takeover...')
    try {
      const res = await fetchWithAuth('/api/civilian/route/execute-ai', {
        method: 'POST',
        body: JSON.stringify({
          mode: selectedMode,
          operation: selectedOperation?.id,
          waypoints,
          destination,
        }),
      }) as { reason?: string } | null
      if (res?.reason) appendAiLog(res.reason)
      appendAiLog('AI takeover acknowledged by backend.')
      success('AI takeover initiated successfully!')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'AI takeover failed'
      appendAiLog(`AI takeover failed: ${errorMessage}`)
      showError(errorMessage)
    } finally {
      setAiBusy(false)
    }
  }

  const handleExecuteMission = async () => {
    if (waypoints.length === 0) {
      showError('Please add at least one waypoint')
      return
    }
    try {
      // Execute mission with waypoints
      const response = await fetchWithAuth('/api/civilian/route/execute', {
        method: 'POST',
        body: JSON.stringify({ waypoints }),
      }) as { success?: boolean; status?: string; message?: string } | null
      if (response && (response.success || response.status === 'success')) {
        success('Mission started successfully!')
      } else {
        showError('Failed to start mission: ' + (response?.message || 'Unknown error'))
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showError(`Failed to execute mission: ${errorMessage}. Please try again.`)
    }
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ErrorBoundary>
        <main id="main-content" className="min-h-screen relative bg-[#0a0f1a] overflow-hidden text-readable">
      {/* Simple dark base — clean so text and panels stand out */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1520] to-[#0f1825]" />
      <div className="absolute inset-0 bg-jarvis-hologram opacity-60" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-dji-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-dji-400/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 layout-dashboard py-4 sm:py-6" style={{ pointerEvents: 'auto' }}>
        {(() => {
          const showSignIn = !demoAuth.isSignedIn
          if (showSignIn) {
            return (
              <div className="min-h-[calc(100vh-200px)] sm:min-h-screen flex items-center justify-center relative z-10 py-8 sm:py-12">
                <div className="text-center card-dji p-6 sm:p-10 md:p-12 lg:p-16 max-w-3xl border-2 border-dji-500/30 animate-hologram-flicker w-full mx-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-dji-500/30 via-dji-400/20 to-blue-500/30 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 md:mb-10 shadow-[0_0_24px_rgba(0,212,255,0.35)] border-2 border-dji-500/40 relative jarvis-voice-active">
                    <div className="absolute inset-0 bg-dji-500/10 animate-jarvis-glow rounded-2xl sm:rounded-3xl"></div>
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-dji-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-5 md:mb-6 text-gradient-dji animate-jarvis-glow font-futuristic tracking-tight">Waypoint Labs</h1>
                  <div className="h-px w-32 sm:w-40 bg-gradient-to-r from-transparent via-dji-500 to-transparent mx-auto mb-4 sm:mb-6 md:mb-8"></div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-3 sm:mb-4 text-dji-300/90 font-futuristic text-slate-200">Agricultural & Wildlife Assistant</h2>
                  <p className="text-sm sm:text-base md:text-lg text-dji-300/70 mb-8 sm:mb-10 md:mb-12 font-futuristic max-w-xl mx-auto text-slate-200 px-4">Advanced AI-powered assistance for farming, hunting, and wildlife management</p>
                  <Link href="/sign-in" className="btn-dji inline-flex items-center gap-2 sm:gap-3 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 touch-manipulation">
                    <span>Demo Login</span>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                </div>
              </div>
            )
          }
          return (
          <div>
          {/* Waypoint Labs Header */}
          <div className="card-dji p-6 sm:p-8 mb-6 animate-fade-in-down border-2 border-dji-500/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                  {/* Enhanced Icon with Multiple Glow Layers */}
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-dji-500/30 via-dji-400/25 to-blue-500/30 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-[0_0_24px_rgba(0,212,255,0.35)] border-2 border-dji-500/50 relative jarvis-voice-active animate-pulse-glow">
                      <div className="absolute inset-0 bg-dji-500/15 animate-jarvis-glow rounded-3xl"></div>
                      <svg className="w-12 h-12 text-dji-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                      </svg>
                    </div>
                    <div className="absolute -inset-3 bg-dji-500/20 rounded-3xl blur-xl animate-pulse"></div>
                    <div className="absolute -inset-6 bg-dji-400/10 rounded-3xl blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gradient-dji animate-jarvis-glow font-futuristic mb-2 sm:mb-3 leading-tight">
                      <span className="block bg-clip-text text-transparent bg-gradient-to-r from-dji-500 via-dji-400 to-blue-500 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}>
                        Waypoint Labs
                      </span>
                    </h1>
                    <p className="text-dji-300/90 text-base sm:text-lg md:text-xl font-futuristic text-slate-200 font-semibold">
                      Agricultural & Wildlife Intelligence System
                    </p>
                  </div>
                </div>
                <p className="text-dji-400/80 text-sm sm:text-base md:text-lg font-futuristic max-w-2xl text-slate-200 leading-relaxed">
                  Advanced AI-powered assistance for farming, hunting, and wildlife management
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Link 
                  href="/supported-drones" 
                  className="px-4 py-2 glass-dji rounded-xl border border-dji-500/20 text-dji-300/80 hover:text-dji-300 hover:border-dji-500/40 transition-all font-futuristic text-sm"
                  title="Supported Drones & Devices"
                >
                  Supported Drones
                </Link>
                <Link 
                  href="/select-role" 
                  className="px-4 py-2 glass-dji rounded-xl border border-dji-500/20 text-dji-300/80 hover:text-dji-300 hover:border-dji-500/40 transition-all font-futuristic text-sm"
                  title="Switch Mode (Alt+M)"
                >
                  <span className="hidden sm:inline">Switch Mode</span>
                  <span className="sm:hidden">Switch</span>
                </Link>
                <DemoUserButton />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="relative mx-auto mb-8">
                    <div className="w-20 h-20 border-4 border-dji-500 border-t-transparent rounded-full animate-spin shadow-[0_0_24px_rgba(0,212,255,0.35)]"></div>
                    <div className="absolute inset-0 w-20 h-20 border-4 border-dji-500/20 rounded-full"></div>
                    <div className="absolute inset-4 w-12 h-12 border-2 border-dji-400/50 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  </div>
                  <p className="text-dji-300 font-futuristic text-xl text-slate-200 mb-2 font-semibold">Initializing Waypoint Labs...</p>
                  <p className="text-dji-400/70 font-futuristic text-sm">Loading advanced features</p>
                  <div className="mt-6 h-px w-48 bg-gradient-to-r from-transparent via-dji-500 to-transparent mx-auto animate-pulse"></div>
                </div>
              </div>
            ) : apiStatus ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Enhanced Status Cards */}
                <div className="card-dji p-6 sm:p-8 hover:scale-[1.03] transition-all duration-500 border-2 border-dji-500/30 group relative overflow-hidden glass-reflection">
                  <div className="absolute inset-0 bg-gradient-to-br from-dji-500/0 to-dji-400/0 group-hover:from-dji-500/10 group-hover:to-dji-400/10 transition-all duration-500"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-dji-400/80 mb-3 sm:mb-4 font-futuristic uppercase tracking-wider font-semibold">System Status</div>
                    <div className="flex items-center justify-between gap-2">
                      <div className={`text-2xl sm:text-3xl md:text-4xl font-extrabold font-futuristic ${apiStatus.running ? 'text-dji-300' : 'text-red-400'}`}>
                        {apiStatus.running ? 'ONLINE' : 'OFFLINE'}
                      </div>
                      {apiStatus.running ? <span className="status-military-online">ACTIVE</span> : <span className="status-offline">INACTIVE</span>}
                    </div>
                  </div>
                </div>
                <div className="card-dji p-8 hover:scale-[1.03] transition-all duration-500 border-2 border-dji-500/30 group relative overflow-hidden glass-reflection">
                  <div className="absolute inset-0 bg-gradient-to-br from-dji-400/0 to-blue-500/0 group-hover:from-dji-400/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-dji-400/80 mb-4 font-futuristic uppercase tracking-wider font-semibold">Authentication</div>
                    <div className="flex items-center justify-between">
                      <div className={`text-4xl font-extrabold font-futuristic ${apiStatus.authenticated ? 'text-dji-300' : 'text-red-400'}`}>
                        {apiStatus.authenticated ? 'VERIFIED' : 'PENDING'}
                      </div>
                      {apiStatus.authenticated ? <span className="status-military-online">SECURE</span> : <span className="status-offline">PENDING</span>}
                    </div>
                  </div>
                </div>
                <div className="card-dji p-8 hover:scale-[1.03] transition-all duration-500 border-2 border-dji-500/30 group relative overflow-hidden glass-reflection">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-dji-500/0 group-hover:from-blue-500/10 group-hover:to-dji-500/10 transition-all duration-500"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-dji-400/80 mb-4 font-futuristic uppercase tracking-wider font-semibold">AI Connection</div>
                    <div className="flex items-center justify-between">
                      <div className={`text-4xl font-extrabold font-futuristic ${wsConnected ? 'text-dji-300' : 'text-red-400'}`}>
                        {wsConnected ? 'LIVE' : 'OFFLINE'}
                      </div>
                      {wsConnected ? <span className="status-military-online">SYNCED</span> : <span className="status-offline">OFFLINE</span>}
                    </div>
                  </div>
                </div>
                <div className="card-dji p-8 hover:scale-[1.03] transition-all duration-500 border-2 border-dji-500/30 group relative overflow-hidden glass-reflection">
                  <div className="absolute inset-0 bg-gradient-to-br from-dji-500/0 via-dji-400/0 to-blue-500/0 group-hover:from-dji-500/10 group-hover:via-dji-400/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-dji-400/80 mb-4 font-futuristic uppercase tracking-wider font-semibold">Active Detections</div>
                    <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gradient-dji font-futuristic animate-jarvis-glow">
                      {detections.length}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-dji p-8 border-2 border-red-500/30 animate-fade-in">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-500/20 border-2 border-red-500/50 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-400 font-futuristic mb-1 text-slate-200">Backend Server Offline</h3>
                    <p className="text-dji-400/70 font-futuristic text-sm text-slate-200">
                      The backend server is not running. Please start it to use Waypoint Labs features.
                    </p>
                  </div>
                </div>
                <div className="glass-dji p-4 rounded-xl border border-dji-500/20">
                  <p className="text-xs text-dji-400/80 font-futuristic mb-2 text-slate-200">
                    <strong className="text-dji-300">To start the backend:</strong>
                  </p>
                  <ul className="text-xs text-dji-400/70 font-mono space-y-1 ml-4 list-disc text-slate-200">
                    <li>Windows: Run <code className="bg-black/40 px-1 rounded">start_server.bat</code></li>
                    <li>Linux/Mac: Run <code className="bg-black/40 px-1 rounded">./start_server_dev.sh</code></li>
                    <li>Or see <code className="bg-black/40 px-1 rounded">QUICK_START.md</code> for details</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Mode Selection */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 animate-fade-in-up">
            {[
              { mode: 'cattle' as const, Icon: IconCattle, title: 'Cattle Mustering', desc: 'Track and manage livestock with AI-powered detection, counting, and route planning' },
              { mode: 'hunting' as const, Icon: IconTarget, title: 'Hunting Assistant', desc: 'Identify game animals, estimate size, weight, and distance with AI route planning' },
              { mode: 'people' as const, Icon: IconUsers, title: 'People Recognition', desc: 'Facial recognition for authorized personnel and visitor management' },
              { Icon: IconCamera, title: 'Filming & Events', desc: 'AI-powered filming for weddings, advertisements, and events with route planning', isFilming: true },
              { mode: 'fishing' as const, Icon: IconFish, title: 'Fishing Operations', desc: 'Scout fish schools, deploy bait with precision, detect underwater structures, and monitor water quality' },
              { mode: 'mining' as const, Icon: IconMining, title: 'Mining (Australia)', desc: 'Survey grids, infrastructure inspection, CASA compliance, dust monitoring, incident response' },
            ].map((item) => (
              <div
                key={item.title}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (item.isFilming) {
                    setSelectedMode('filming')
                    setActiveTab('plan')
                  } else if (item.mode) {
                    handleModeSelect(item.mode)
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (item.isFilming) {
                      setSelectedMode('filming')
                      setActiveTab('plan')
                    } else if (item.mode) {
                      handleModeSelect(item.mode)
                      setActiveTab('plan')
                    }
                  }
                }}
                className={`group card-dji p-6 sm:p-8 cursor-pointer transform transition-all duration-500 hover:scale-105 active:scale-95 border-2 ${
                  selectedMode === (item.mode ?? (item.isFilming ? 'filming' : null)) 
                    ? 'border-dji-500/60 shadow-[0_0_24px_rgba(0,212,255,0.35)] ring-2 ring-dji-500/30' 
                    : 'border-dji-500/20 hover:border-dji-500/40'
                }`}
                style={{ pointerEvents: 'auto', zIndex: 10, position: 'relative' }}
              >
                <div className="text-center">
                  <div className="mb-4 sm:mb-6 flex justify-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800/80 border border-dji-500/30 flex items-center justify-center text-dji-400 group-hover:scale-105 transition-transform">
                      <item.Icon className="w-8 h-8 sm:w-9 sm:h-9" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gradient-dji mb-2 sm:mb-3 font-futuristic text-on-dark">{item.title}</h3>
                  <p className="text-on-dark-muted text-xs sm:text-sm font-futuristic leading-relaxed">{item.desc}</p>
                </div>
                {selectedMode === (item.mode ?? (item.isFilming ? 'filming' : null)) && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-dji-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                )}
              </div>
            ))}
          </div>

          {/* Main Content Tabs - Enhanced for Better Navigation */}
          {selectedMode && (
            <div className="mb-6 animate-fade-in sticky top-[64px] z-30 bg-slate-900/95 backdrop-blur-xl border-b border-dji-500/20 pb-4 shadow-lg pt-4" id="operations">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {[
                  { id: 'plan', label: 'Operation Planning', Icon: IconClipboard, shortcut: '1', description: 'Plan routes and operations' },
                  { id: 'chat', label: 'AI Chat', Icon: IconChat, shortcut: '2', description: 'Chat with AI assistant' },
                  { id: 'manual', label: 'Manual Control', Icon: IconGamepad, shortcut: '3', description: 'Manual drone control' },
                  { id: 'autonomous', label: 'Autonomy', Icon: IconChip, shortcut: '4', description: 'Autonomous operations' },
                  { id: 'monitoring', label: 'Monitoring', Icon: IconChart, shortcut: '5', description: 'Video feeds, analytics, and detections' },
                  { id: 'advanced', label: 'Advanced', Icon: IconCog, shortcut: '6', description: 'Voice, gesture, VR, and multi-screen controls' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setActiveTab(tab.id as 'plan' | 'chat' | 'manual' | 'autonomous' | 'monitoring' | 'advanced')
                      // When switching to monitoring tab, ensure video tab is selected
                      if (tab.id === 'monitoring') {
                        setRightColumnTab('video')
                      }
                      // Scroll to top of content smoothly
                      setTimeout(() => {
                        document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 100)
                    }}
                    className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 cursor-pointer font-futuristic whitespace-nowrap flex items-center gap-1 sm:gap-2 group relative touch-target ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-dji-500 via-dji-400 to-blue-500 text-white shadow-[0_0_24px_rgba(0,212,255,0.35)] border-2 border-dji-500/50 animate-jarvis-glow scale-105'
                        : 'glass-dji border-2 border-dji-500/20 text-dji-400/70 hover:border-dji-500/40 hover:text-dji-300 hover:scale-[1.02]'
                    }`}
                    style={{ pointerEvents: 'auto', zIndex: 10 }}
                    title={`${tab.label} - ${tab.description} (Press ${tab.shortcut})`}
                    aria-label={tab.label}
                  >
                    <tab.Icon className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-on-dark hidden sm:inline text-sm sm:text-base">{tab.label}</span>
                    <span className="text-xs opacity-70 hidden lg:inline">({tab.shortcut})</span>
                    {/* Tooltip on hover */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {tab.description}
                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></span>
                    </span>
                  </button>
                ))}
              </div>
              {/* Tab indicator line */}
              <div className="h-1 bg-dji-500/20 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-dji-500 to-dji-400 transition-all duration-300 absolute left-0 top-0"
                  style={{ 
                    width: '16.666%', 
                    transform: `translateX(${['plan', 'chat', 'manual', 'autonomous', 'monitoring', 'advanced'].indexOf(activeTab) * 100}%)` 
                  }}
                />
              </div>

              <div className={`grid gap-6 ${selectedMode && (activeTab === 'plan' || activeTab === 'chat' || activeTab === 'manual' || activeTab === 'autonomous') ? 'lg:grid-cols-2' : activeTab === 'monitoring' || activeTab === 'advanced' ? 'lg:grid-cols-1' : 'lg:grid-cols-2'}`}>
                {/* Left Column */}
                <div className="space-y-6">
                  {activeTab === 'plan' && (
                    <>
                      {/* Dronelink-style Mission Planning Hub: 3D preview, estimates, mapping, templates */}
                      {selectedMode && (
                        <div className="animate-fade-in">
                          <MissionPlanningHub
                            waypoints={waypoints}
                            drones={drones}
                            mode={selectedMode}
                            onWaypointsChange={setWaypoints}
                            onWaypointAdd={(wp) => {
                              const next = [...waypoints, wp]
                              setWaypoints(next)
                              updateRealtimeWaypoints(next)
                            }}
                            onWaypointUpdate={(wp) => {
                              const next = waypoints.map((w) => (w.id === wp.id ? wp : w))
                              setWaypoints(next)
                              updateRealtimeWaypoints(next)
                            }}
                            onWaypointDelete={(id) => {
                              const next = waypoints.filter((w) => w.id !== id)
                              setWaypoints(next)
                              updateRealtimeWaypoints(next)
                            }}
                          />
                        </div>
                      )}
                      <OperationOptions
                        mode={selectedMode}
                        onSelect={handleOperationSelect}
                        selectedOption={selectedOperation?.id}
                      />
                      {selectedMode === 'mining' && (
                        <MiningDashboard
                          mode="mining"
                          location={location.lat && location.lon ? location : undefined}
                          destination={destination.lat && destination.lon ? destination : undefined}
                          onRoutePlanned={setRoutePlan}
                          onSurveyGridPlanned={setWaypoints}
                        />
                      )}
                      {selectedOperation && (
                        <div className="card-dji p-6 sm:p-8 animate-fade-in border-2 border-dji-500/20 relative">
                          <h4 className="text-lg sm:text-xl font-bold text-gradient-dji mb-4 sm:mb-6 font-futuristic text-slate-200">Operation Details</h4>
                          <div className="space-y-3 sm:space-y-4 relative">
                            <div>
                              <label className="text-xs text-dji-400/70 mb-2 block font-futuristic uppercase tracking-wider text-slate-200">Operation Type</label>
                              <div className="glass-dji border border-dji-500/20 rounded-xl p-3 sm:p-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-dji-500/30 flex items-center justify-center text-dji-400 flex-shrink-0">
                                    <IconClipboard className="w-7 h-7" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-dji-300 font-futuristic text-lg text-on-dark">{selectedOperation.title}</div>
                                    <div className="text-sm text-on-dark-muted font-futuristic">{selectedOperation.description}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {selectedOperation.requiresLocation && (
                              <div>
                                <label className="text-xs text-dji-400/70 mb-2 block font-futuristic uppercase tracking-wider text-slate-200">Start Location</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="Latitude"
                                    value={location.lat}
                                    onChange={(e) => setLocation((prev) => ({ ...prev, lat: e.target.value }))}
                                    className="glass-dji border border-dji-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm text-dji-300 placeholder-dji-400/30 focus:outline-none focus:border-dji-500/50 focus:ring-2 focus:ring-dji-500/20 font-futuristic bg-dji-500/5 text-slate-200 touch-target"
                                  />
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="Longitude"
                                    value={location.lon}
                                    onChange={(e) => setLocation((prev) => ({ ...prev, lon: e.target.value }))}
                                    className="glass-dji border border-dji-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm text-dji-300 placeholder-dji-400/30 focus:outline-none focus:border-dji-500/50 focus:ring-2 focus:ring-dji-500/20 font-futuristic bg-dji-500/5 text-slate-200 touch-target"
                                  />
                                </div>
                              </div>
                            )}
                            {selectedOperation.requiresDestination && (
                              <div>
                                <label className="text-xs text-dji-400/70 mb-2 block font-futuristic uppercase tracking-wider text-slate-200">Destination</label>
                                <div className="grid grid-cols-2 gap-3">
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="Latitude"
                                    value={destination.lat}
                                    onChange={(e) => setDestination((prev) => ({ ...prev, lat: e.target.value }))}
                                    className="glass-dji border border-dji-500/20 rounded-xl px-4 py-3 text-sm text-dji-300 placeholder-dji-400/30 focus:outline-none focus:border-dji-500/50 focus:ring-2 focus:ring-dji-500/20 font-futuristic bg-dji-500/5 text-slate-200"
                                  />
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="Longitude"
                                    value={destination.lon}
                                    onChange={(e) => setDestination((prev) => ({ ...prev, lon: e.target.value }))}
                                    className="glass-dji border border-dji-500/20 rounded-xl px-4 py-3 text-sm text-dji-300 placeholder-dji-400/30 focus:outline-none focus:border-dji-500/50 focus:ring-2 focus:ring-dji-500/20 font-futuristic bg-dji-500/5 text-slate-200"
                                  />
                                </div>
                              </div>
                            )}
                            <button 
                              className="btn-dji w-full touch-target"
                              onClick={async () => {
                                if (!selectedOperation) return
                                const parseCoord = (value: string) => {
                                  const num = Number(value)
                                  return Number.isFinite(num) ? num : null
                                }
                                if (selectedOperation.requiresLocation) {
                                  const lat = parseCoord(location.lat)
                                  const lon = parseCoord(location.lon)
                                  if (lat === null || lon === null) {
                                    showError('Please provide valid numeric coordinates for the start location.')
                                    return
                                  }
                                }
                                if (selectedOperation.requiresDestination) {
                                  const lat = parseCoord(destination.lat)
                                  const lon = parseCoord(destination.lon)
                                  if (lat === null || lon === null) {
                                    showError('Please provide valid numeric coordinates for the destination.')
                                    return
                                  }
                                }
                                try {
                                  const endpoint = selectedMode === 'cattle' 
                                    ? '/api/civilian/route/plan-mustering'
                                    : selectedMode === 'hunting'
                                    ? '/api/civilian/route/plan-hunting'
                                    : selectedMode === 'filming'
                                    ? '/api/civilian/route/plan-filming'
                                    : selectedMode === 'fishing'
                                    ? '/api/civilian/route/plan-fishing'
                                    : selectedMode === 'mining'
                                    ? (selectedOperation?.id === 'survey-grid' ? '/api/mining/survey/grid' : '/api/mining/route/plan')
                                    : '/api/civilian/route/plan'
                                  const response = await fetchWithAuth(endpoint, {
                                    method: 'POST',
                                    body: JSON.stringify(selectedMode === 'mining' && selectedOperation?.id === 'survey-grid'
                                    ? {
                                        location: selectedOperation.requiresLocation ? { lat: parseCoord(location.lat) ?? 0, lon: parseCoord(location.lon) ?? 0 } : undefined,
                                        destination: selectedOperation.requiresDestination ? { lat: parseCoord(destination.lat) ?? 0, lon: parseCoord(destination.lon) ?? 0 } : undefined,
                                        rows: 5,
                                        cols: 5,
                                        spacing_m: 20,
                                      }
                                    : { 
                                      operation: selectedOperation?.id,
                                      mode: selectedMode,
                                      location: selectedOperation?.requiresLocation
                                        ? {
                                            lat: parseCoord(location.lat) ?? 0,
                                            lon: parseCoord(location.lon) ?? 0,
                                          }
                                        : undefined,
                                      destination: selectedOperation?.requiresDestination
                                        ? {
                                            lat: parseCoord(destination.lat) ?? 0,
                                            lon: parseCoord(destination.lon) ?? 0,
                                          }
                                        : undefined,
                                    }),
                                  }) as { route?: RoutePlan; waypoints?: Waypoint[] } | null
                                  if (response?.route) {
                                    setRoutePlan(response.route)
                                    success('Route planned successfully!')
                                    if (response.route.waypoints?.length && !response.waypoints?.length) {
                                      setWaypoints(response.route.waypoints as Waypoint[])
                                    }
                                  }
                                  if (response?.waypoints?.length) {
                                    setWaypoints(response.waypoints)
                                  }
                                } catch (err: unknown) {
                                  const errorMessage = err instanceof Error ? err.message : 'Failed to plan route. Please try again.'
                                  logger.error('Failed to plan route:', err)
                                  showError(errorMessage)
                                }
                              }}
                              disabled={
                                !selectedOperation ||
                                (selectedOperation.requiresLocation && (!location.lat || !location.lon)) ||
                                (selectedOperation.requiresDestination && (!destination.lat || !destination.lon))
                              }
                            >
                              Plan Route
                            </button>
                            {/* AI route helpers */}
                            <div className="grid md:grid-cols-2 gap-3 mt-4">
                              <button
                                className="px-4 sm:px-6 py-2 sm:py-3 glass-dji border-2 border-dji-500/20 rounded-xl text-dji-300 hover:border-dji-500/40 transition-all font-futuristic w-full text-slate-200 touch-target"
                                onClick={requestAiRouteCleanup}
                                disabled={aiBusy || waypoints.length === 0}
                              >
                                {aiBusy ? 'AI Cleaning…' : 'AI Clean Route'}
                              </button>
                              <button
                                className="btn-dji w-full"
                                onClick={requestAiRecommendation}
                                disabled={aiBusy}
                              >
                                {aiBusy ? 'AI Thinking…' : 'AI Recommend Route'}
                              </button>
                            </div>
                            <div className="mt-3">
                              <button
                                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/50 transition-all transform hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-red-500/60 font-futuristic w-full touch-target"
                                onClick={requestAiTakeover}
                                disabled={aiBusy || waypoints.length === 0}
                              >
                                {aiBusy ? 'AI Executing…' : 'Let AI Take Over'}
                              </button>
                            </div>
                            <div className="mt-3 glass-dji border border-dji-500/20 rounded-xl">
                              <button
                                className="w-full flex items-center justify-between px-4 py-3 text-sm text-white"
                                onClick={() => setAiLogOpen((v) => !v)}
                              >
                                <span>AI Reasoning Log</span>
                                <span>{aiLogOpen ? '▾' : '▸'}</span>
                              </button>
                              {aiLogOpen && (
                                <div className="max-h-48 overflow-y-auto px-4 pb-4 space-y-2 text-xs text-dji-400/80 font-futuristic">
                                  {aiLog.length === 0 ? (
                                    <div className="text-slate-500">No AI activity yet.</div>
                                  ) : (
                                    aiLog.map((line, idx) => (
                                      <div key={idx} className="glass border border-white/5 rounded p-2">
                                        {line}
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                            {routePlan && (
                              <div className="card-glass p-4 mt-4 border border-emerald-500/30 animate-fade-in">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                  <h5 className="text-sm font-semibold text-emerald-200">Planned Route</h5>
                                </div>
                                <pre className="text-xs text-slate-200 bg-black/40 rounded-lg p-3 overflow-x-auto">
{JSON.stringify(routePlan, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'chat' && (
                    <div id="chat">
                      <AIChatInterface
                        mode={selectedMode}
                        onRouteGenerated={(route) => {
                          const convertedRoute: RoutePlan = {
                            waypoints: route.waypoints?.map((wp, idx) => ({
                              id: `wp_${Date.now()}_${idx}`,
                              lat: wp.lat,
                              lon: wp.lon,
                              alt: wp.alt ?? 100,
                              name: `Waypoint ${idx + 1}`,
                            })) || [],
                            distance_km: route.distance_km as number | undefined,
                            estimated_time_minutes: route.estimated_time_minutes as number | undefined,
                            fuel_consumption: route.fuel_consumption as number | undefined,
                          }
                          setRoutePlan(convertedRoute)
                          if (route.waypoints?.length) {
                            setWaypoints(convertedRoute.waypoints || [])
                            updateRealtimeWaypoints(convertedRoute.waypoints || [])
                          }
                        }}
                        onAdviceReceived={setAiAdvice}
                        onExecuteMission={handleExecuteMission}
                        waypointsCount={waypoints.length}
                        incomingVoiceTranscript={voiceTranscriptForChat}
                        onVoiceTranscriptConsumed={() => setVoiceTranscriptForChat(null)}
                        voiceReplyEnabled={true}
                      />
                    </div>
                  )}

                  {activeTab === 'manual' && (
                    <ManualControlPanel
                      waypoints={waypoints}
                      onWaypointsChange={setWaypoints}
                      onExecute={handleExecuteMission}
                    />
                  )}

                  {activeTab === 'autonomous' && (
                    <>
                    <AutonomousModeSelector
                      mode={selectedMode}
                      selectedMode={selectedAutonomy}
                      onSelect={(mode) => setSelectedAutonomy(mode.id)}
                    />
                      {/* 3D Mission View - Compact in Autonomous tab */}
                  {selectedMode && (
                        <div className="mt-6 animate-fade-in">
                          <div className="card-dji p-6 border-2 border-dji-500/20">
                            <h3 className="text-xl font-bold text-gradient-dji mb-4 font-futuristic text-slate-200">3D Mission View</h3>
                            <div className="h-80">
                          <CesiumMissionView
                            waypoints={waypoints}
                            drones={drones}
                            mode={selectedMode}
                            onWaypointAdd={(wp) => {
                              const newWaypoints = [...waypoints, wp]
                              setWaypoints(newWaypoints)
                              updateRealtimeWaypoints(newWaypoints)
                            }}
                            onWaypointUpdate={(wp) => {
                              const newWaypoints = waypoints.map(w => w.id === wp.id ? wp : w)
                              setWaypoints(newWaypoints)
                              updateRealtimeWaypoints(newWaypoints)
                            }}
                            onWaypointDelete={(id) => {
                              const newWaypoints = waypoints.filter(w => w.id !== id)
                              setWaypoints(newWaypoints)
                              updateRealtimeWaypoints(newWaypoints)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                      {/* AI Drone Command Interface in Autonomous tab */}
                      {selectedMode && drones.length > 0 && (
                        <div className="mt-6 animate-fade-in">
                          <AIDroneCommandInterface
                        mode={selectedMode}
                            drones={drones}
                            onCommandExecuted={() => {
                              success('Command executed')
                            }}
                      />
                    </div>
                  )}
                      {/* LLM Command Interface in Autonomous tab */}
                  {selectedMode && (
                        <div className="mt-6 animate-fade-in">
                      <LLMCommandInterface
                        mode={selectedMode}
                        availableDrones={drones.map(d => d.id)}
                        onCommandProcessed={(cmd) => {
                          if (cmd?.action) {
                            success(`Command: ${cmd.action}`)
                          }
                        }}
                      />
                    </div>
                  )}
                      {/* Explainable AI Dashboard in Autonomous tab */}
                  {selectedMode && (
                        <div className="mt-6 animate-fade-in">
                      <ExplainableAIDashboard
                        decisionId={`decision_${Date.now()}`}
                        decisionData={{
                          action: "Continue tracking",
                          confidence: 0.87,
                          reasoning: "Target moving predictably, high confidence",
                          factors: [
                            { name: "Target Confidence", weight: 0.35, impact: "High" },
                            { name: "Trajectory Predictability", weight: 0.25, impact: "Medium" },
                            { name: "Sensor Agreement", weight: 0.20, impact: "High" }
                          ],
                          alternatives: [
                            { action: "Increase distance", confidence: 0.65, reason: "More conservative" }
                          ]
                        }}
                      />
                    </div>
                  )}
                    </>
                  )}

                  {activeTab === 'monitoring' && (
                    <div className="space-y-6">
                      {/* Sub-tabs for Monitoring */}
                      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
                        {[
                          { id: 'video', label: 'Video Feed', Icon: IconVideo },
                          { id: 'analytics', label: 'Analytics', Icon: IconChart },
                          { id: 'detections', label: 'Detections', Icon: IconSearch },
                        ].map((subTab) => (
                          <button
                            key={subTab.id}
                            onClick={() => setRightColumnTab(subTab.id as 'video' | 'analytics' | 'detections')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 cursor-pointer font-futuristic whitespace-nowrap flex items-center gap-2 ${
                              rightColumnTab === subTab.id
                                ? 'bg-gradient-to-r from-dji-500 to-dji-400 text-white shadow-[0_0_24px_rgba(0,212,255,0.35)] border-2 border-dji-500/50'
                                : 'glass-dji border-2 border-dji-500/20 text-dji-400/70 hover:border-dji-500/40 hover:text-dji-300'
                            }`}
                          >
                            <subTab.Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-on-dark">{subTab.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Video Feed Content */}
                      {rightColumnTab === 'video' && (
                        <div className="card-dji p-4 sm:p-6 animate-fade-in border-2 border-dji-500/20">
                          <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                            <h2 className="text-xl sm:text-2xl font-bold text-gradient-dji font-futuristic text-slate-200">
                              {selectedMode 
                                ? `Multi-Drone Video Feed - ${selectedMode === 'cattle' ? 'Cattle' : selectedMode === 'hunting' ? 'Wildlife' : selectedMode === 'filming' ? 'Filming' : selectedMode === 'fishing' ? 'Fishing' : selectedMode === 'mining' ? 'Mining' : 'People'}`
                                : 'Drone Video Streaming'}
                            </h2>
                          </div>
                          {selectedMode ? (
                            <MultiDroneVideoManager
                              mode={selectedMode}
                              initialDrones={drones}
                              onDronesChange={(newDrones) => {
                                setDrones(newDrones)
                                updateRealtimeDrones(newDrones)
                              }}
                              onDetections={(_droneId, newDetections) => {
                                // Update detections - aggregate from all drones
                                // Since Detection type doesn't include drone_id, we'll just update with all new detections
                                setDetections(newDetections)
                                updateRealtimeDetections(newDetections)
                              }}
                            />
                          ) : (
                            <div className="card-glass p-12 text-center border-2 border-dji-500/20">
                              <div className="mb-6">
                                <svg className="w-24 h-24 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <h3 className="text-xl font-bold text-white mb-2">No Video Mode Selected</h3>
                                <p className="text-slate-400">Select a mode to start video streaming</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Analytics Content */}
                      {rightColumnTab === 'analytics' && selectedMode && (
                        <div className="animate-fade-in">
                          {selectedMode === 'fishing' ? (
                            <FishingAnalyticsDashboard
                              detections={detections}
                              drones={drones}
                              boatLocation={location.lat && location.lon ? {
                                lat: parseFloat(location.lat) || 0,
                                lon: parseFloat(location.lon) || 0
                              } : undefined}
                            />
                          ) : (
                            <AnalyticsDashboard
                              drones={drones}
                              detections={detections}
                              mode={selectedMode}
                            />
                          )}
                        </div>
                      )}

                      {/* Detections Content */}
                      {rightColumnTab === 'detections' && selectedMode && (
                        <>
                          {selectedMode === 'fishing' ? (
                            <FishDetectionPanel
                              detections={detections}
                              boatLocation={location.lat && location.lon ? {
                                lat: parseFloat(location.lat) || 0,
                                lon: parseFloat(location.lon) || 0
                              } : undefined}
                              onNavigateToFish={(fish) => {
                                if (fish.location_from_boat?.bearing_degrees && fish.location_from_boat?.distance_meters) {
                                  // Calculate target location based on boat position and fish bearing/distance
                                  const bearing = fish.location_from_boat.bearing_degrees * Math.PI / 180
                                  const distance = fish.location_from_boat.distance_meters / 111000 // Convert to degrees (rough)
                                  const boatLat = parseFloat(location.lat) || 0
                                  const boatLon = parseFloat(location.lon) || 0
                                  const targetLat = boatLat + distance * Math.cos(bearing)
                                  const targetLon = boatLon + distance * Math.sin(bearing)
                                  setDestination({ lat: targetLat.toString(), lon: targetLon.toString() })
                                  success(`Navigating to fish location: ${fish.species || 'Fish'}`)
                                }
                              }}
                            />
                          ) : detections.length > 0 ? (
                            <div className="card-dji p-4 sm:p-6 animate-fade-in border-2 border-dji-500/20">
                              <h2 className="text-xl sm:text-2xl font-bold text-gradient-dji mb-4 sm:mb-6 font-futuristic text-slate-200">
                                Detection Results - {MODE_DETECTION_LABELS[selectedMode ?? 'people'] ?? '👥 People'}
                              </h2>
                              <div className="grid grid-cols-1 gap-3 sm:gap-4 max-h-[600px] overflow-y-auto">
                                {detections.map((detection, index) => (
                                  <div key={index} className="card-dji p-3 sm:p-4 border-2 border-dji-500/20 hover:border-dji-500/40 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-bold text-lg text-gradient-dji font-futuristic text-slate-200">
                                        {detection.label || 'Unknown'}
                                      </div>
                                      {detection.confidence && (
                                        <div className="px-3 py-1 bg-dji-500/20 border-2 border-dji-500/50 text-dji-300 rounded-lg text-sm font-bold font-futuristic">
                                          {(detection.confidence * 100).toFixed(0)}%
                                        </div>
                                      )}
                                    </div>
                                    {detection.distance && (
                                      <div className="text-sm text-dji-400/80 font-futuristic text-slate-200">
                                        <span className="font-semibold text-dji-300">Distance:</span> {detection.distance}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </>
                      )}
                      {rightColumnTab === 'detections' && detections.length === 0 && (
                        <div className="card-dji p-6 sm:p-8 text-center border-2 border-dji-500/20">
                          <p className="text-dji-400/70 font-futuristic text-slate-200 text-sm sm:text-base">No detections yet. Start a mission to see detection results.</p>
                </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'advanced' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="card-dji p-4 sm:p-6 border-2 border-dji-500/20">
                        <h3 className="text-lg sm:text-xl font-bold text-gradient-dji mb-3 sm:mb-4 font-futuristic text-slate-200">Advanced Controls</h3>
                        <p className="text-xs sm:text-sm text-dji-400/70 mb-4 sm:mb-6 font-futuristic text-slate-200">
                          Access voice commands, gesture controls, VR mode, and multi-screen management
                        </p>
                      </div>

                      {/* Voice Control — headset-friendly; sends to AI chat for confirm-then-execute */}
                      {selectedMode && (
                        <div className="animate-fade-in">
                          <VoiceControl
                            onCommand={(cmd) => {
                              if (cmd?.trim()) {
                                success(`Voice: "${cmd.slice(0, 40)}${cmd.length > 40 ? '…' : ''}"`)
                              }
                            }}
                            onTranscriptForAI={(text) => setVoiceTranscriptForChat(text)}
                            enabled={true}
                          />
                        </div>
                      )}

                      {/* Gesture Control */}
                      {selectedMode && (
                        <div className="animate-fade-in">
                          <GestureControl
                            onGesture={(gesture) => {
                              if (gesture) {
                                success(`Gesture: ${gesture} — mapped to control when backend supports it`)
                              }
                            }}
                            enabled={true}
                          />
                        </div>
                      )}

                      {/* VR Mission Control */}
                      {selectedMode && (
                        <div className="animate-fade-in">
                          <VRMissionControl
                            drones={drones}
                            waypoints={waypoints}
                          />
                        </div>
                      )}

                      {/* Multi-Screen Control */}
                      {selectedMode && (
                        <div className="animate-fade-in">
                          <MultiScreenControl />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Live Drone Feed (visible on Plan / Chat / Manual / Autonomous so user can see stream while interacting with AI) */}
                {selectedMode && (activeTab === 'plan' || activeTab === 'chat' || activeTab === 'manual' || activeTab === 'autonomous') && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-dji-400 uppercase tracking-wider">Live Drone Feed</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                      {[
                        { id: 'video' as const, label: 'Video', Icon: IconVideo },
                        { id: 'analytics' as const, label: 'Analytics', Icon: IconChart },
                        { id: 'detections' as const, label: 'Detections', Icon: IconSearch },
                      ].map((subTab) => (
                        <button
                          key={subTab.id}
                          onClick={() => setRightColumnTab(subTab.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            rightColumnTab === subTab.id
                              ? 'bg-dji-500/20 text-dji-400 border border-dji-500/40'
                              : 'text-on-dark-muted hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <subTab.Icon className="w-4 h-4 flex-shrink-0" />
                          <span>{subTab.label}</span>
                        </button>
                      ))}
                    </div>
                    {rightColumnTab === 'video' && (
                      <div className="card-dji p-4 animate-fade-in border-2 border-dji-500/20">
                        <MultiDroneVideoManager
                          mode={selectedMode}
                          initialDrones={drones}
                          onDronesChange={(newDrones) => {
                            setDrones(newDrones)
                            updateRealtimeDrones(newDrones)
                          }}
                          onDetections={(_droneId, newDetections) => {
                            setDetections(newDetections)
                            updateRealtimeDetections(newDetections)
                          }}
                        />
                      </div>
                    )}
                    {rightColumnTab === 'analytics' && selectedMode && (
                      <div className="animate-fade-in">
                        {selectedMode === 'fishing' ? (
                          <FishingAnalyticsDashboard
                            detections={detections}
                            drones={drones}
                            boatLocation={location.lat && location.lon ? { lat: parseFloat(location.lat) || 0, lon: parseFloat(location.lon) || 0 } : undefined}
                          />
                        ) : (
                          <AnalyticsDashboard drones={drones} detections={detections} mode={selectedMode} />
                        )}
                      </div>
                    )}
                    {rightColumnTab === 'detections' && selectedMode && (
                      <div className="space-y-2 animate-fade-in">
                        {selectedMode === 'fishing' ? (
                          <FishDetectionPanel
                            detections={detections}
                            boatLocation={location.lat && location.lon ? { lat: parseFloat(location.lat) || 0, lon: parseFloat(location.lon) || 0 } : undefined}
                            onNavigateToFish={(fish) => {
                              if (fish.location_from_boat?.bearing_degrees != null && fish.location_from_boat?.distance_meters != null) {
                                const bearing = (fish.location_from_boat.bearing_degrees * Math.PI) / 180
                                const distance = (fish.location_from_boat.distance_meters || 0) / 111000
                                const boatLat = parseFloat(location.lat) || 0
                                const boatLon = parseFloat(location.lon) || 0
                                const targetLat = boatLat + distance * Math.cos(bearing)
                                const targetLon = boatLon + distance * Math.sin(bearing)
                                setDestination({ lat: targetLat.toString(), lon: targetLon.toString() })
                                success(`Navigating to ${fish.species || 'fish'} location`)
                              }
                            }}
                          />
                        ) : detections.length === 0 ? (
                          <div className="card-dji p-4 text-center border-2 border-dji-500/20">
                            <p className="text-sm text-slate-400">No detections yet.</p>
                          </div>
                        ) : (
                          detections.slice(0, 20).map((det, idx) => (
                            <div key={idx} className="card-dji p-3 border-2 border-dji-500/20">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-dji-300">{det.label || 'Unknown'}</span>
                                {det.confidence != null && <span className="text-xs text-slate-400">{(det.confidence * 100).toFixed(0)}%</span>}
                              </div>
                              {det.distance != null && <p className="text-xs text-slate-500">{det.distance}</p>}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
          )
        })()}
      </div>
      <QuickActions role="civilian" />
    </main>
    
    {/* AI Advisor - Fixed position outside main to avoid overflow clipping */}
    {aiAdvice && (
      <div className="fixed bottom-24 right-6 max-w-md w-[calc(100vw-3rem)] md:w-96 card-glass p-4 sm:p-6 border-2 border-blue-500/50 animate-fade-in z-[100] shadow-2xl backdrop-blur-xl bg-slate-900/95 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1 8a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
            <h5 className="text-base font-bold text-blue-200">AI Advice</h5>
          </div>
          <button
            onClick={() => setAiAdvice('')}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close AI advice"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{aiAdvice}</p>
      </div>
    )}
      </ErrorBoundary>
    </div>
  )
}