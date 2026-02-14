'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MilitaryPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/civilian')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-dji text-readable">
      <div className="absolute inset-0 bg-app-dji-gradient" />
      <div className="relative z-10 text-center text-slate-300">
        <p>Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
