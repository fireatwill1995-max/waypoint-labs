'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpClient() {
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/sign-in')
    }, 800)
    return () => clearTimeout(t)
  }, [router])

  useEffect(() => {
    const n = setTimeout(() => setRedirecting(false), 1500)
    return () => clearTimeout(n)
  }, [])

  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1a] p-4 text-readable"
      aria-live="polite"
      aria-label="Sign up"
    >
      <div className="card-dji p-8 max-w-md w-full text-center border-2 border-dji-500/20">
        {redirecting ? (
          <>
            <div className="w-12 h-12 border-4 border-dji-500/50 border-t-dji-400 rounded-full animate-spin mx-auto mb-4" aria-hidden />
            <p className="text-slate-300 font-futuristic">Redirecting to sign in...</p>
          </>
        ) : (
          <>
            <p className="text-slate-300 font-futuristic mb-4">If you are not redirected, use the link below.</p>
            <Link href="/sign-in" className="btn-dji inline-flex items-center gap-2 touch-manipulation">
              Go to Sign In
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
