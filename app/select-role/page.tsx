'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SelectRolePage() {
  const router = useRouter()

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', 'civilian')
      }
    } catch {
      // ignore
    }
    router.replace('/civilian')
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-app-dji">
      <div className="text-slate-400 font-futuristic">Redirecting to dashboard...</div>
    </main>
  )
}
