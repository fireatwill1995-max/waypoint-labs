'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSafeUser } from '../useSafeUser'
import { DemoUserButton } from './DemoAuth'
import WaypointLogo from './WaypointLogo'
import { IconHome, IconClipboard, IconDrone, IconChart, IconTarget, IconBolt, IconCog, IconUsers, IconRefresh, IconLogout, IconLogin, IconMap } from './UIcons'

interface NavItem {
  name: string
  href: string
  Icon: React.ComponentType<{ className?: string }>
  shortcut?: string
}

interface NavigationProps {
  role?: 'civilian' | 'military' | 'admin' | null
}

export default function Navigation({ role: propRole }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useSafeUser()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [role, setRole] = useState<'civilian' | 'military' | 'admin' | null>(propRole ?? null)

  useEffect(() => {
    setMounted(true)
    if (!propRole && typeof window !== 'undefined') {
      try {
        const storedRole = localStorage.getItem('userRole')
        if (storedRole && ['civilian', 'military', 'admin'].includes(storedRole)) {
          setRole(storedRole as 'civilian' | 'military' | 'admin')
        } else if (storedRole) {
          localStorage.removeItem('userRole')
        }
      } catch {
        // localStorage unavailable
      }
    }
  }, [propRole])

  const hideNavPages = ['/sign-in', '/sign-up']
  const shouldHideNav = pathname != null && hideNavPages.some(page => pathname.startsWith(page))

  const navigationItems: NavItem[] = role === 'civilian'
    ? [
        { name: 'Dashboard', href: '/civilian', Icon: IconHome, shortcut: 'Alt+D' },
        { name: 'Operations', href: '/civilian#operations', Icon: IconClipboard },
        { name: 'Drones', href: '/civilian#drones', Icon: IconDrone },
        { name: 'Analytics', href: '/civilian#analytics', Icon: IconChart },
      ]
    : role === 'military'
    ? [
        { name: 'Command Center', href: '/military', Icon: IconTarget, shortcut: 'Alt+D' },
        { name: 'Mission Control', href: '/military#mission', Icon: IconTarget },
        { name: 'Assets', href: '/military#assets', Icon: IconBolt },
      ]
    : role === 'admin'
    ? [
        { name: 'Admin Dashboard', href: '/admin', Icon: IconCog, shortcut: 'Alt+D' },
        { name: 'Users', href: '/admin#users', Icon: IconUsers },
        { name: 'System', href: '/admin#system', Icon: IconCog },
      ]
    : [
        { name: 'Home', href: '/', Icon: IconHome, shortcut: 'Alt+H' },
        { name: 'Supported Drones', href: '/supported-drones', Icon: IconMap },
        { name: 'Dashboard', href: '/civilian', Icon: IconHome, shortcut: 'Alt+M' },
      ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname != null && pathname.startsWith(href)
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'h') {
        e.preventDefault()
        router.push('/')
      }
      if (e.altKey && e.key === 'm') {
        e.preventDefault()
        router.push('/civilian')
      }
      if (e.altKey && e.key === 'd' && role) {
        e.preventDefault()
        router.push(role === 'civilian' ? '/civilian' : role === 'military' ? '/military' : '/admin')
      }
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [router, role, mobileMenuOpen])

  if (!mounted || shouldHideNav) return null

  return (
    <nav className="sticky top-0 z-50 glass-dji border-b border-dji-500/30 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          <div className="flex items-center gap-4">
            <Link href={role ? (role === 'civilian' ? '/civilian' : role === 'military' ? '/military' : '/admin') : '/'} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <WaypointLogo size={40} className="flex-shrink-0" />
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-white">Waypoint Labs</div>
                <div className="text-xs text-slate-400">
                  {role === 'civilian' ? 'Civilian Ops' : role === 'military' ? 'Military GCS' : role === 'admin' ? 'Admin' : 'Ground Control'}
                </div>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (item.href.includes('#')) {
                    const [path, hash] = item.href.split('#')
                    if (pathname === path && hash) {
                      e.preventDefault()
                      const element = document.getElementById(hash)
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }
                  }
                }}
                className={`px-2 lg:px-3 xl:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all group relative touch-target ${
                  isActive(item.href)
                    ? 'nav-dji-active'
                    : 'nav-dji-inactive'
                }`}
                title={item.shortcut ? `${item.name} (${item.shortcut})` : item.name}
              >
                <item.Icon className="mr-1 lg:mr-2 w-4 h-4 sm:w-5 sm:h-5 text-current" />
                <span className="hidden lg:inline">{item.name}</span>
                {item.shortcut != null && (
                  <span className="ml-2 text-xs opacity-50 hidden xl:inline">{item.shortcut}</span>
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/civilian"
                className="btn-dji-secondary text-xs py-2 px-3 touch-target inline-flex items-center gap-1.5"
                title="Dashboard (Alt+M)"
              >
                <IconRefresh className="w-4 h-4" />
                Dashboard
              </Link>
            </div>

            {user != null ? (
              <DemoUserButton />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="px-2 sm:px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all border border-white/10 touch-target"
                >
                  Demo Login
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all touch-target"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-dji-500/20 bg-slate-900/95 backdrop-blur-xl">
          <div className="px-3 sm:px-4 py-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 sm:px-4 py-3 rounded-lg text-sm font-medium transition-all touch-target flex items-center ${
                  isActive(item.href)
                    ? 'nav-dji-active'
                    : 'nav-dji-inactive'
                }`}
              >
                <item.Icon className="mr-3 w-5 h-5 text-current flex-shrink-0" />
                {item.name}
              </Link>
            ))}
            <div className="pt-3 border-t border-dji-500/20">
              <Link
                href="/civilian"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 sm:px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all touch-target flex items-center"
              >
                <IconRefresh className="mr-3 w-5 h-5 flex-shrink-0" />
                Dashboard
              </Link>
              {user != null ? (
                <button
                  type="button"
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                    router.push('/sign-in')
                  }}
                  className="w-full text-left px-3 sm:px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all touch-target flex items-center"
                >
                  <IconLogout className="mr-3 w-5 h-5 flex-shrink-0" />
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 sm:px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all touch-target flex items-center"
                >
                  <IconLogin className="mr-3 w-5 h-5 flex-shrink-0" />
                  Demo Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
