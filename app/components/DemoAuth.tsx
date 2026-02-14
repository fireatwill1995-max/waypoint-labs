'use client'

import { useState } from 'react'
import { useDemoAuth, ADMIN_CREDENTIALS } from '../lib/demoAuth'
import WaypointLogo from './WaypointLogo'

const DEMO_EMAIL = 'demo@waypointlabs.io'

export function DemoSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showAdminForm, setShowAdminForm] = useState(false)
  const { signIn } = useDemoAuth()

  const handleDemoSignIn = () => {
    setError('')
    const result = signIn(DEMO_EMAIL, '')
    if (result.success) {
      window.location.href = '/civilian'
    } else {
      setError(result.error || 'Sign in failed')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const result = signIn(email, password)
    if (result.success && result.user) {
      window.location.href = result.user.role === 'admin' ? '/admin' : '/civilian'
    } else {
      setError(result.error || 'Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10 p-4 sm:p-6">
      <div className="text-center card-dji p-6 sm:p-10 md:p-12 lg:p-16 max-w-3xl w-full">
        <div className="flex justify-center mb-6 sm:mb-8 md:mb-10">
          <WaypointLogo size={96} className="sm:w-24 sm:h-24 md:w-32 md:h-32" />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-5 md:mb-6 text-gradient-dji font-futuristic tracking-tight">
          Waypoint Labs
        </h1>

        <div className="h-px w-32 sm:w-40 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mb-4 sm:mb-6 md:mb-8" />
        <p className="text-sm sm:text-base md:text-lg text-slate-400 mb-6 sm:mb-8 max-w-xl mx-auto px-4">
          Sign in to access the civilian dashboard
        </p>

        {error && (
          <div
            id="signin-error"
            role="alert"
            className="mb-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-xs sm:text-sm font-futuristic text-left"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleDemoSignIn}
          className="btn-dji w-full inline-flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 touch-manipulation min-h-[44px] mb-6 sm:mb-8"
          aria-label="Sign in"
        >
          <span>Sign in</span>
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <div className="pt-4 border-t border-dji-500/20">
          <button
            type="button"
            onClick={() => setShowAdminForm(!showAdminForm)}
            className="text-xs sm:text-sm text-slate-500 hover:text-slate-300 font-futuristic underline touch-manipulation py-1"
          >
            {showAdminForm ? 'Hide admin sign in' : 'Admin? Sign in with email and password'}
          </button>

          {showAdminForm && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left" aria-label="Admin sign in" noValidate>
              <div>
                <label htmlFor="admin-email" className="block text-xs sm:text-sm text-slate-400 mb-2 font-medium font-futuristic">Email</label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={ADMIN_CREDENTIALS.email}
                  className="input-dji w-full rounded-xl font-futuristic"
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-xs sm:text-sm text-slate-400 mb-2 font-medium font-futuristic">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="input-dji w-full rounded-xl font-futuristic"
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="btn-dji-secondary w-full py-2 px-4 touch-manipulation min-h-[44px] text-sm font-futuristic">
                Sign in as admin
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export function DemoUserButton() {
  const { user, signOut } = useDemoAuth()

  if (!user) return null

  return (
    <div className="relative flex items-center gap-3" role="group" aria-label="User menu">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dji-500 to-dji-600 flex items-center justify-center text-white font-semibold text-sm border border-cyan-400/30 flex-shrink-0" aria-hidden>
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="hidden sm:block text-left min-w-0">
        <div className="text-sm font-semibold text-dji-400 truncate">{user.name}</div>
        <div className="text-xs text-slate-400 truncate">{user.email}</div>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="btn-dji-secondary text-sm px-4 sm:px-5 py-2 min-h-[44px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-dji-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        title="Sign Out"
        aria-label="Sign out"
      >
        <span className="hidden sm:inline">Sign Out</span>
        <span className="sm:hidden">Out</span>
      </button>
    </div>
  )
}
