'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDemoAuth } from '../lib/demoAuth'
import { logger } from '../lib/logger'
import { IconHome, IconCog, IconArrowRight } from '../components/UIcons'

const VALID_ROLES = ['civilian', 'admin'] as const

export default function SelectRolePage() {
  const router = useRouter()
  const demoAuth = useDemoAuth()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  useEffect(() => {
    try {
      const role = localStorage.getItem('userRole')
      if (role && VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
        setSelectedRole(role)
      }
    } catch {
      // localStorage may be unavailable
    }
  }, [])

  const handleRoleSelect = (role: string) => {
    const safeRole = VALID_ROLES.includes(role as typeof VALID_ROLES[number]) ? role : 'civilian'
    try {
      localStorage.setItem('userRole', safeRole)
      setSelectedRole(safeRole)

      setTimeout(() => {
        if (safeRole === 'admin') router.push('/admin')
        else router.push('/civilian')
      }, 300)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Error saving role:', error)
      }
    }
  }

  const roles = [
    {
      id: 'civilian',
      title: 'Civilian',
      Icon: IconHome,
      description: 'Agricultural, wildlife, and personal drone operations',
      color: 'from-emerald-500 to-cyan-500',
      borderColor: 'border-emerald-500/50',
      href: '/civilian',
    },
    {
      id: 'admin',
      title: 'Administrator',
      Icon: IconCog,
      description: 'System administration and configuration',
      color: 'from-blue-500 to-indigo-500',
      borderColor: 'border-blue-500/50',
      href: '/admin',
    },
  ]

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden bg-[#0a0f1a]">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-cyan-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
      </div>

      <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-emerald-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-64 h-64 sm:w-96 sm:h-96 bg-dji-500/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 max-w-6xl mx-auto w-full px-2 sm:px-4">
        <div className="text-center mb-6 sm:mb-8 md:mb-12 animate-fade-in">
          <div className="inline-block mb-4 sm:mb-6 md:mb-8 p-4 sm:p-6 panel-dji rounded-xl sm:rounded-2xl">
            <svg className="w-16 h-16 sm:w-20 sm:h-20 text-dji-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-3 sm:mb-4 md:mb-6 text-gradient-dji leading-tight px-2 font-futuristic">
            <span className="block">Select Your Role</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-200 mb-2 sm:mb-3 md:mb-4 max-w-3xl mx-auto font-light px-4">
            Choose your operational mode
          </p>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 mb-6 sm:mb-8 md:mb-12 max-w-2xl mx-auto px-4">
            Each role provides access to different features and capabilities
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => handleRoleSelect(role.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleRoleSelect(role.id)
                }
              }}
              aria-pressed={selectedRole === role.id}
              aria-label={`Select ${role.title} role. ${role.description}`}
              className={`group relative p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 touch-manipulation card-dji focus:outline-none focus-visible:ring-2 focus-visible:ring-dji-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                selectedRole === role.id
                  ? 'border-dji-500/60 shadow-[0_0_28px_rgba(0,212,255,0.25)]'
                  : 'border-dji-500/20 hover:border-dji-500/40'
              }`}
            >
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl sm:rounded-2xl`}
              />
              <div className="relative z-10">
                <div className="mb-4 sm:mb-5 md:mb-6 flex justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl bg-slate-800/80 border border-dji-500/30 flex items-center justify-center text-dji-400 group-hover:scale-105 transition-transform">
                    <role.Icon className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 font-futuristic">{role.title}</h2>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{role.description}</p>
                {selectedRole === role.id && (
                  <div className="mt-4 sm:mt-5 md:mt-6 flex items-center justify-center gap-2 text-dji-400">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold text-sm sm:text-base">Selected</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-4 sm:mt-6">
          <Link
            href="/civilian"
            className="btn-dji inline-flex items-center gap-2 sm:gap-3 text-base sm:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 group touch-manipulation"
          >
            <span>Continue to Dashboard</span>
            <IconArrowRight className="w-5 h-5 sm:w-6 sm:h-6 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {demoAuth.isSignedIn && (
          <div className="mt-6 sm:mt-8 text-center px-4">
            <p className="text-xs sm:text-sm text-slate-400 mb-2">
              Signed in as: <span className="text-dji-400 font-semibold">{demoAuth.user?.name}</span>
            </p>
            <button
              onClick={() => {
                demoAuth.signOut()
                router.push('/sign-in')
              }}
              className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors underline touch-manipulation py-2"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
