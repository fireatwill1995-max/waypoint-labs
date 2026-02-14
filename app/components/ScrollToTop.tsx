'use client'

import { useState, useEffect } from 'react'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const toggleVisibility = () => {
      try {
        const offset = window.pageYOffset || window.scrollY || 0
        if (typeof offset === 'number' && !isNaN(offset)) {
          setIsVisible(offset > 300)
        }
      } catch (error) {
        // Silently handle scroll errors
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', toggleVisibility)
      }
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 right-4 sm:right-6 z-40 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/90 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600/90 hover:scale-110 transition-all"
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  )
}
