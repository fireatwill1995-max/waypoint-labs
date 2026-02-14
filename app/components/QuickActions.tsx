'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { IconClipboard, IconDrone, IconChat, IconChart, IconTarget, IconBolt, IconMap, IconUsers, IconCog, IconGamepad, IconVideo, IconKeyboard } from './UIcons'

interface QuickAction {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  href: string
  shortcut?: string
  color?: string
}

interface QuickActionsProps {
  role?: 'civilian' | 'military' | 'admin' | 'pilot' | null
}

export default function QuickActions({ role }: QuickActionsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showShortcuts, setShowShortcuts] = useState(false)

  const quickActions: QuickAction[] = useMemo(() => role === 'civilian'
    ? [
        { label: 'Operations', Icon: IconClipboard, href: '/civilian#operations', shortcut: 'O', color: 'emerald' },
        { label: 'View Drones', Icon: IconDrone, href: '/civilian#drones', shortcut: 'D', color: 'blue' },
        { label: 'AI Chat', Icon: IconChat, href: '/civilian#chat', shortcut: 'C', color: 'purple' },
        { label: 'Analytics', Icon: IconChart, href: '/civilian#analytics', shortcut: 'A', color: 'cyan' },
      ]
    : role === 'military'
    ? [
        { label: 'Mission Control', Icon: IconTarget, href: '/military#mission', shortcut: 'M', color: 'cyan' },
        { label: 'Assets', Icon: IconBolt, href: '/military#assets', shortcut: 'A', color: 'blue' },
        { label: 'Tactical View', Icon: IconMap, href: '/military#tactical', shortcut: 'T', color: 'purple' },
      ]
    : role === 'admin'
    ? [
        { label: 'Users', Icon: IconUsers, href: '/admin#users', shortcut: 'U', color: 'blue' },
        { label: 'System Config', Icon: IconCog, href: '/admin#config', shortcut: 'S', color: 'purple' },
        { label: 'Performance', Icon: IconChart, href: '/admin#performance', shortcut: 'P', color: 'green' },
      ]
    : role === 'pilot'
    ? [
        { label: 'Control', Icon: IconGamepad, href: '/pilot#control', shortcut: 'C', color: 'blue' },
        { label: 'Video', Icon: IconVideo, href: '/pilot#video', shortcut: 'V', color: 'purple' },
        { label: 'Missions', Icon: IconTarget, href: '/pilot#missions', shortcut: 'M', color: 'cyan' },
      ]
    : [], [role])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Show shortcuts help with ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowShortcuts(!showShortcuts)
        return
      }

      // Quick action shortcuts (Alt + key)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const action = quickActions.find(a => a.shortcut?.toLowerCase() === e.key.toLowerCase())
        if (action) {
          e.preventDefault()
          // Handle hash navigation
          if (action.href.includes('#')) {
            const [path, hash] = action.href.split('#')
            if (path) {
              router.push(path)
              // Scroll to section after navigation
              if (hash) {
                setTimeout(() => {
                  const element = document.getElementById(hash)
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }, 100)
              }
            }
          } else {
            router.push(action.href)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [router, quickActions, showShortcuts])

  if (quickActions.length === 0) return null

  return (
    <>
      {/* Floating Quick Actions */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 max-h-[calc(100vh-120px)] overflow-y-auto pb-2">
        {/* Shortcuts Help Toggle */}
        <button
          type="button"
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="w-12 h-12 min-h-[48px] min-w-[48px] glass-dji border border-dji-500/30 rounded-full flex items-center justify-center text-slate-100 shadow-lg hover:border-dji-500/50 transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-dji-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          title="Show Keyboard Shortcuts (?)"
          aria-label="Show keyboard shortcuts"
          aria-expanded={showShortcuts}
        >
          <IconKeyboard className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden />
        </button>

        {/* Quick Action Buttons */}
        {quickActions.map((action, index) => {
          const colorClasses: Record<string, string> = {
            emerald: 'from-emerald-500 to-emerald-600',
            blue: 'from-blue-500 to-blue-600',
            purple: 'from-purple-500 to-purple-600',
            cyan: 'from-cyan-500 to-cyan-600',
            green: 'from-green-500 to-green-600',
          }
          const colorClass = colorClasses[action.color || 'blue'] || colorClasses.blue
          
          return (
            <Link
              key={action.label}
              href={action.href}
              onClick={(e) => {
                // Handle hash navigation
                if (action.href.includes('#')) {
                  const [path, hash] = action.href.split('#')
                  if (pathname === path && hash) {
                    e.preventDefault()
                    const element = document.getElementById(hash)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }
                }
              }}
              className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colorClass} backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-all group relative`}
              style={{ animationDelay: `${index * 100}ms` }}
              title={`${action.label} (Alt+${action.shortcut})`}
            >
              <action.Icon className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="absolute right-full mr-3 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {action.label}
                {action.shortcut && (
                  <span className="ml-2 text-slate-400">Alt+{action.shortcut}</span>
                )}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Shortcuts Help Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          <div className="card-dji border-2 border-dji-500/20 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 id="shortcuts-title" className="text-xl font-bold text-slate-100 font-futuristic">Keyboard Shortcuts</h3>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close shortcuts"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-slate-300">Alt + H</span>
                <span className="text-white">Go to Home</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-slate-300">Alt + M</span>
                <span className="text-white">Switch Mode</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-slate-300">Alt + D</span>
                <span className="text-white">Go to Dashboard</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-slate-300">Alt + ←</span>
                <span className="text-white">Go Back</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-slate-300">?</span>
                <span className="text-white">Show/Hide Shortcuts</span>
              </div>
              {quickActions.map((action) => (
                <div key={action.label} className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-slate-300">Alt + {action.shortcut}</span>
                  <span className="text-white">{action.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400 text-center">Press ? again to close</p>
          </div>
        </div>
      )}
    </>
  )
}
