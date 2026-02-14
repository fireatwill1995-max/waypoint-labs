'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  const pathname = usePathname()

  // Don't show on landing pages
  const hideOn = ['/', '/sign-in', '/sign-up', '/select-role']
  const shouldHide = hideOn.includes(pathname || '')

  const handleBack = useCallback(() => {
    // Go to home or role selection based on role
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
    if (role === 'civilian') {
      router.push('/civilian')
    } else if (role === 'military') {
      router.push('/military')
    } else if (role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }, [router])

  // Keyboard shortcut: Alt + Left Arrow
  useEffect(() => {
    if (shouldHide) return // Don't set up keyboard shortcut if hidden
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        handleBack()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [router, shouldHide, handleBack])

  // Don't show on landing pages
  if (shouldHide) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="fixed top-20 left-4 sm:left-6 z-40 w-12 h-12 min-h-[48px] min-w-[48px] glass-dji border border-dji-500/30 rounded-full flex items-center justify-center text-slate-100 shadow-lg hover:border-dji-500/50 transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-dji-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 group"
      title="Go Back (Alt+←)"
      aria-label="Go back to dashboard"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span className="absolute left-full ml-3 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        Go Back
        <span className="ml-2 text-slate-400">Alt+←</span>
      </span>
    </button>
  )
}
