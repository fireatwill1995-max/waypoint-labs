'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { IconDrone, IconTarget, IconCog, IconMap } from '../components/UIcons'

const ROLES = [
  {
    id: 'civilian',
    title: 'Civilian',
    description: 'Agricultural, filming, fishing, mining, and wildlife operations',
    href: '/civilian',
    Icon: IconDrone,
  },
  {
    id: 'military',
    title: 'Military',
    description: 'Command center, mission control, and asset management',
    href: '/military',
    Icon: IconTarget,
  },
  {
    id: 'admin',
    title: 'Admin',
    description: 'System administration, users, security, and audit logs',
    href: '/admin',
    Icon: IconCog,
  },
  {
    id: 'pilot',
    title: 'Pilot',
    description: 'Direct flight control and mission execution',
    href: '/pilot',
    Icon: IconMap,
  },
] as const

export default function SelectRolePage() {
  const router = useRouter()

  const handleSelectRole = useCallback(
    (roleId: string) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('userRole', roleId)
        }
      } catch {
        // ignore
      }
      const role = ROLES.find((r) => r.id === roleId)
      if (role) router.replace(role.href)
    },
    [router]
  )

  return (
    <main
      id="main-content"
      className="min-h-screen relative overflow-hidden bg-app-dji text-readable"
      aria-label="Select your role"
    >
      <div className="absolute inset-0 bg-app-dji-gradient" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gradient-dji font-futuristic mb-3">
            Select your role
          </h1>
          <p className="text-slate-400 font-futuristic text-lg max-w-xl mx-auto">
            Choose how you will use Waypoint Labs. You can change this later from the dashboard.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => handleSelectRole(role.id)}
              className="card-dji p-6 sm:p-8 border-2 border-dji-500/20 hover:border-dji-500/50 transition-all text-left group rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-dji-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label={`Select ${role.title}: ${role.description}`}
            >
              <div className="w-14 h-14 rounded-xl bg-dji-500/20 border border-dji-500/40 flex items-center justify-center text-dji-400 mb-4 group-hover:scale-105 transition-transform">
                <role.Icon className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-futuristic mb-2">
                {role.title}
              </h2>
              <p className="text-slate-400 font-futuristic text-sm sm:text-base">
                {role.description}
              </p>
              <span className="inline-flex items-center gap-2 mt-4 text-dji-400 font-semibold text-sm font-futuristic group-hover:gap-3 transition-all">
                Continue as {role.title}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          ))}
        </div>

        <p className="text-center mt-8 text-slate-500 text-sm font-futuristic">
          <Link href="/civilian" className="text-dji-400 hover:text-dji-300 underline">
            Already signed in? Go to dashboard
          </Link>
          <span className="mx-2 text-slate-600">|</span>
          <Link href="/sign-in" className="text-dji-400 hover:text-dji-300 underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
