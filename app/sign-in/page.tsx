'use client'

import { DemoSignIn } from '../components/DemoAuth'
import { useDemoAuth } from '../lib/demoAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignInPage() {
  const router = useRouter()
  const demoAuth = useDemoAuth()

  useEffect(() => {
    if (demoAuth.isSignedIn) {
      router.replace('/select-role')
    }
  }, [demoAuth.isSignedIn, router])

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0f1a] text-readable">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1520] to-[#0f1825]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-dji-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-dji-400/10 rounded-full blur-3xl pointer-events-none" />
      <main id="main-content" className="relative z-10" aria-label="Sign in">
        <DemoSignIn />
      </main>
    </div>
  )
}
