'use client'

import Link from 'next/link'
import { IconTarget, IconDrone } from '../components/UIcons'

export default function MilitaryPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen relative overflow-hidden bg-app-dji text-readable"
      aria-label="Military Command Center"
    >
      <div className="absolute inset-0 bg-app-dji-gradient" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-4 sm:px-6">
        <section className="text-center max-w-2xl mx-auto" aria-labelledby="military-heading">
          <div className="w-20 h-20 rounded-2xl bg-dji-500/20 border-2 border-dji-500/40 flex items-center justify-center mx-auto mb-6">
            <IconTarget className="w-10 h-10 text-dji-400" aria-hidden />
          </div>
          <h1 id="military-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gradient-dji font-futuristic mb-4">
            Command Center
          </h1>
          <p className="text-slate-400 font-futuristic text-lg mb-4">
            Mission control and asset management run in the unified operations dashboard. Run missions, manage drones, and view analytics in one place.
          </p>
          <p className="text-slate-500 font-futuristic text-sm mb-8">
            Use the nav to open Mission Control, Assets, and the full dashboard (Alt+D when role is Military).
          </p>
          <Link
            href="/civilian"
            className="btn-dji inline-flex items-center justify-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 touch-manipulation"
          >
            <IconDrone className="w-5 h-5" aria-hidden />
            Open unified operations dashboard
          </Link>
          <div className="mt-8 pt-6 border-t border-dji-500/20">
            <Link href="/civilian#operations" className="text-dji-400 hover:text-dji-300 font-futuristic text-sm">
              Jump to Operations →
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
