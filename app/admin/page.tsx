'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApi } from '../lib/api'
import { ErrorBoundary } from '../components/ErrorBoundary'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'
import { useDemoAuth } from '../lib/demoAuth'
import { DemoSignIn, DemoUserButton } from '../components/DemoAuth'
import { IconCog, IconChart, IconUsers, IconLock, IconClipboard } from '../components/UIcons'
import AdminDashboard from '../components/admin/AdminDashboard'
import UserManagement from '../components/admin/UserManagement'
import SystemConfig from '../components/admin/SystemConfig'
import PerformanceMonitor from '../components/admin/PerformanceMonitor'
import SecuritySettings from '../components/admin/SecuritySettings'
import AuditLogs from '../components/admin/AuditLogs'
import type { ApiStatus } from '../types/api'

const VALID_ADMIN_ROLE = 'admin'
const ADMIN_CODE_STORAGE_KEY = 'admin_code_verified'
const ADMIN_ACCESS_CODE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE) || 'WL-ADMIN-2024'

function getAdminCodeVerified(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(ADMIN_CODE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function setAdminCodeVerified(): void {
  try {
    if (typeof window !== 'undefined') sessionStorage.setItem(ADMIN_CODE_STORAGE_KEY, 'true')
  } catch {
    // ignore
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'system' | 'performance' | 'security' | 'audit'>('dashboard')
  const [adminCodeVerified, setAdminCodeVerifiedState] = useState(false)
  const [adminCodeInput, setAdminCodeInput] = useState('')
  const [adminCodeError, setAdminCodeError] = useState('')
  const { fetchWithAuth } = useApi()
  const { toasts, removeToast } = useToast()
  
  const demoAuth = useDemoAuth()

  // Restore code verification from session
  useEffect(() => {
    setAdminCodeVerifiedState(getAdminCodeVerified())
  }, [])

  // Enforce admin role when signed in
  useEffect(() => {
    if (!demoAuth.isSignedIn) return
    try {
      if (typeof window !== 'undefined') {
        const role = localStorage.getItem('userRole')
        if (role !== VALID_ADMIN_ROLE) {
          router.push('/select-role')
        }
      }
    } catch {
      // localStorage may be unavailable
    }
  }, [router, demoAuth.isSignedIn])

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
          setActiveTab('dashboard')
        } else if (e.key === '2') {
          e.preventDefault()
          setActiveTab('users')
        } else if (e.key === '3') {
          e.preventDefault()
          setActiveTab('system')
        } else if (e.key === '4') {
          e.preventDefault()
          setActiveTab('performance')
        } else if (e.key === '5') {
          e.preventDefault()
          setActiveTab('security')
        } else if (e.key === '6') {
          e.preventDefault()
          setActiveTab('audit')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const isAuthenticated = demoAuth.isSignedIn

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] p-4 text-readable">
        <div className="card-dji p-8 max-w-md w-full border-2 border-dji-500/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-800/90 border border-dji-500/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-dji-400">
              <IconCog className="w-10 h-10" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 font-futuristic mb-2">Admin Dashboard</h1>
            <p className="text-slate-300 font-futuristic">Please sign in to access system administration</p>
          </div>
          <DemoSignIn />
        </div>
      </div>
    )
  }

  // Admin access code required (once per session)
  if (!adminCodeVerified) {
    const handleCodeSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      setAdminCodeError('')
      const trimmed = adminCodeInput.trim()
      if (trimmed === ADMIN_ACCESS_CODE) {
        setAdminCodeVerified()
        setAdminCodeVerifiedState(true)
      } else {
        setAdminCodeError('Invalid access code')
      }
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] p-4 text-readable">
        <div className="card-dji p-8 max-w-md w-full border-2 border-dji-500/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-800/90 border border-dji-500/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-dji-400">
              <IconLock className="w-10 h-10" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 font-futuristic mb-2">Admin Access Code</h1>
            <p className="text-slate-300 font-futuristic text-sm">Enter the admin code to continue. Code is required for admin accounts only.</p>
          </div>
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-code" className="block text-left text-sm text-slate-400 mb-2 font-medium font-futuristic">
                Access code
              </label>
              <input
                id="admin-code"
                type="password"
                value={adminCodeInput}
                onChange={(e) => { setAdminCodeInput(e.target.value); setAdminCodeError('') }}
                placeholder="Enter admin code"
                className="input-dji w-full rounded-xl font-futuristic"
                autoComplete="off"
                autoFocus
                aria-invalid={!!adminCodeError}
                aria-describedby={adminCodeError ? 'admin-code-error' : undefined}
              />
            </div>
            {adminCodeError && (
              <p id="admin-code-error" role="alert" className="text-red-400 text-sm font-futuristic">
                {adminCodeError}
              </p>
            )}
            <button type="submit" className="btn-dji w-full py-3 font-futuristic">
              Continue
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-dji-500/20 flex justify-between items-center">
            <span className="text-xs text-slate-500 font-futuristic">Signed in as {demoAuth.user?.name}</span>
            <button type="button" onClick={demoAuth.signOut} className="text-xs text-dji-400 hover:text-dji-300 font-futuristic">
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] text-readable">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dji-500/50 border-t-dji-400 rounded-full animate-spin mx-auto mb-4" aria-hidden />
          <p className="text-slate-300 font-futuristic">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0a0f1a] text-readable">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1520] to-[#0f1825]" />
        {/* Header */}
        <header className="sticky top-0 z-50 glass-dji border-b border-dji-500/30 backdrop-blur-xl relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/admin" className="flex items-center gap-3 hover:opacity-90 transition-opacity" aria-label="Admin Dashboard home">
                  <div className="w-10 h-10 bg-gradient-to-br from-dji-500 to-dji-600 rounded-xl flex items-center justify-center border border-dji-400/40 shadow-[0_0_16px_rgba(9,113,206,0.3)]">
                    <IconCog className="w-5 h-5 text-white" aria-hidden />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-100 font-futuristic">Admin Dashboard</div>
                    <div className="text-xs text-slate-400 font-futuristic">System Administration</div>
                  </div>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <DemoUserButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="relative layout-dashboard py-6">
          {/* Status Bar */}
          <div className="mb-6 flex items-center gap-4 flex-wrap" role="status" aria-live="polite">
            <div className="flex items-center gap-2 px-4 py-2 glass-dji rounded-xl border border-dji-500/20">
              <div className={`w-2 h-2 rounded-full ${apiStatus?.running ? 'bg-dji-400 animate-pulse' : 'bg-red-400'}`} aria-hidden />
              <span className="text-sm text-slate-300 font-futuristic">
                API: {apiStatus?.running ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {apiStatus?.authenticated && (
              <div className="px-4 py-2 glass-dji rounded-xl border border-dji-500/20">
                <span className="text-sm text-slate-300 font-futuristic">
                  Authenticated: <span className="text-dji-400 font-semibold">Yes</span>
                </span>
              </div>
            )}
          </div>

          {/* Main Tabs */}
          <div className="mb-6 animate-fade-in sticky top-[64px] z-30 bg-slate-900/95 backdrop-blur-xl border-b border-dji-500/20 pb-4 shadow-lg pt-2">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2" role="tablist" aria-label="Admin sections">
              {[
                { id: 'dashboard', label: 'Dashboard', Icon: IconChart, shortcut: '1', description: 'System overview and metrics' },
                { id: 'users', label: 'Users', Icon: IconUsers, shortcut: '2', description: 'User management' },
                { id: 'system', label: 'System Config', Icon: IconCog, shortcut: '3', description: 'System configuration' },
                { id: 'performance', label: 'Performance', Icon: IconChart, shortcut: '4', description: 'Performance monitoring' },
                { id: 'security', label: 'Security', Icon: IconLock, shortcut: '5', description: 'Security settings' },
                { id: 'audit', label: 'Audit Logs', Icon: IconClipboard, shortcut: '6', description: 'System audit logs' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-label={`${tab.label}. ${tab.description}`}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap inline-flex items-center gap-2 touch-target font-futuristic text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-dji-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                    activeTab === tab.id
                      ? 'nav-dji-active text-slate-100'
                      : 'nav-dji-inactive text-slate-400'
                  }`}
                  title={`${tab.description} (Press ${tab.shortcut})`}
                >
                  <tab.Icon className="w-5 h-5 flex-shrink-0" aria-hidden />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'system' && <SystemConfig />}
            {activeTab === 'performance' && <PerformanceMonitor />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'audit' && <AuditLogs />}
          </div>
        </main>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </ErrorBoundary>
  )
}
