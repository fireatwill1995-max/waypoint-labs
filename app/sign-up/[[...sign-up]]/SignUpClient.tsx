'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import WaypointLogo from '../../components/WaypointLogo'

export default function SignUpClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(() => router.replace('/sign-in'), 1500)
    return () => clearTimeout(t)
  }, [submitted, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    setSubmitted(true)
  }

  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center bg-app-dji p-4 text-readable"
      aria-live="polite"
      aria-label="Sign up"
    >
      <div className="absolute inset-0 bg-app-dji-gradient" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
      <div className="relative z-10 card-dji p-6 sm:p-10 max-w-md w-full border-2 border-dji-500/20">
        <div className="flex justify-center mb-6">
          <WaypointLogo size={80} className="sm:w-24 sm:h-24" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient-dji font-futuristic text-center mb-2">
          Create account
        </h1>
        <p className="text-slate-400 font-futuristic text-sm text-center mb-6">
          Enter your email to get started. You will sign in on the next step.
        </p>

        {submitted ? (
          <div className="text-center py-6" role="status" aria-live="polite">
            <div className="w-12 h-12 rounded-full bg-dji-500/20 border-2 border-dji-500/50 flex items-center justify-center mx-auto mb-4" aria-hidden>
              <svg className="w-6 h-6 text-dji-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-dji-300 font-futuristic font-semibold">Account created successfully</p>
            <p className="text-slate-300 font-futuristic mt-2">Redirecting to sign in...</p>
            <p className="text-slate-500 text-sm font-futuristic mt-2">
              Complete sign in there to access the dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-label="Sign up form">
            <div>
              <label htmlFor="signup-email" className="block text-sm text-slate-400 mb-2 font-medium font-futuristic">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder="you@example.com"
                className="input-dji w-full rounded-xl font-futuristic"
                autoComplete="email"
                autoFocus
                aria-invalid={!!error}
                aria-describedby={error ? 'signup-error' : undefined}
              />
            </div>
            {error && (
              <p id="signup-error" role="alert" className="text-red-400 text-sm font-futuristic">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="btn-dji w-full py-3 font-futuristic touch-manipulation min-h-[44px]"
            >
              Continue
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-dji-500/20 text-center">
          <Link
            href="/sign-in"
            className="text-dji-400 hover:text-dji-300 font-futuristic text-sm underline touch-manipulation"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
