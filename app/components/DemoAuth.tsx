'use client'

import { useState } from 'react'
import { useDemoAuth, DEMO_USERS, ADMIN_CREDENTIALS } from '../lib/demoAuth'

export function DemoSignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn } = useDemoAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const result = signIn(email, password)
    if (result.success) {
      window.location.href = '/select-role'
    } else {
      setError(result.error || 'Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10 p-4 sm:p-6">
      <div className="text-center card-dji p-6 sm:p-10 md:p-12 lg:p-16 max-w-3xl w-full">
        {/* GCS Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-slate-800/90 border border-dji-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 md:mb-10 shadow-[0_0_24px_rgba(9,113,206,0.3)] relative">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-dji-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-5 md:mb-6 text-gradient-dji font-futuristic tracking-tight">
          Waypoint Labs
        </h1>

        <div className="h-px w-32 sm:w-40 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mb-4 sm:mb-6 md:mb-8" />
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-3 sm:mb-4 text-dji-400 font-futuristic">
          Demo Mode — Sign In
        </h2>

        <p className="text-sm sm:text-base md:text-lg text-slate-400 mb-6 sm:mb-8 md:mb-12 max-w-xl mx-auto px-4">
          Use demo credentials to test the application
        </p>

        {/* Demo account: only civilian shown; admin signs in with email/password below */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 glass-dji rounded-lg text-left">
          <h3 className="text-xs sm:text-sm font-semibold text-dji-400 mb-3 sm:mb-4 uppercase tracking-wider">Demo account</h3>
          <div className="space-y-2 sm:space-y-3">
            {DEMO_USERS.filter((u) => u.role !== 'admin').map((demoUser) => (
              <div key={demoUser.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 bg-slate-800/50 rounded-lg border border-dji-500/20">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-dji-400 text-xs sm:text-sm truncate">{demoUser.name}</div>
                  <div className="text-xs text-slate-400 truncate">{demoUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(demoUser.email)
                    const result = signIn(demoUser.email, '')
                    if (result.success) {
                      window.location.href = '/select-role'
                    } else {
                      setError(result.error || 'Sign in failed')
                    }
                  }}
                  className="btn-dji-secondary w-full sm:w-auto text-xs py-2 px-4 touch-manipulation min-h-[44px]"
                  aria-label={`Use demo account ${demoUser.name}`}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3 font-futuristic">
            Administrators: sign in with your email and password below.
          </p>
        </div>

        {/* Sign In Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5 md:space-y-6"
          aria-label="Demo sign in form"
          noValidate
        >
          {error && (
            <div
              id="signin-error"
              role="alert"
              className="p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-xs sm:text-sm font-futuristic"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="demo-email" className="block text-left text-xs sm:text-sm text-slate-400 mb-2 font-medium font-futuristic">
              Email
            </label>
            <input
              id="demo-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@waypointlabs.io"
              className="input-dji w-full rounded-xl font-futuristic"
              required
              autoComplete="email"
              aria-invalid={!!error}
              aria-describedby={error ? 'signin-error' : undefined}
            />
          </div>

          <div>
            <label htmlFor="demo-password" className="block text-left text-xs sm:text-sm text-slate-400 mb-2 font-medium font-futuristic">
              Password {email.toLowerCase() === ADMIN_CREDENTIALS.email ? '(required for admin)' : '(optional for demo)'}
            </label>
            <input
              id="demo-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={email.toLowerCase() === ADMIN_CREDENTIALS.email ? 'Enter admin password' : 'Any password or leave empty'}
              className="input-dji w-full rounded-xl font-futuristic"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-dji w-full inline-flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 touch-manipulation min-h-[44px]"
            aria-label="Sign in with demo credentials"
          >
            <span>Sign In</span>
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </form>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-dji-500/20">
          <p className="text-xs text-slate-500 px-2">
            Demo mode. Use Demo Login to access all features.
          </p>
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
