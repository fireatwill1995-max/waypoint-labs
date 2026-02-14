'use client'

import Link from 'next/link'
import { IconDrone, IconMap, IconChip, IconChart, IconSparkles, IconCheck } from './components/UIcons'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0f1a] text-readable">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1520] to-[#0f1825]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-dji-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-dji-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Hero */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-16 sm:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dji border border-dji-500/30 text-dji-300 text-sm font-futuristic mb-6">
              <IconSparkles className="w-4 h-4" />
              <span>More drones. One platform.</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 sm:mb-6 text-gradient-dji font-futuristic leading-tight">
              Waypoint Labs
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 font-futuristic -mt-2 mb-2">
              Drone Flight Control
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-6 sm:mb-8 font-futuristic max-w-2xl mx-auto">
              Fully automated missions, semi-automated workflows, and manual flight tools. AI-powered for every use case.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-in"
                className="btn-dji inline-flex items-center justify-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 touch-manipulation"
              >
                Get started
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link
                href="/supported-drones"
                className="btn-dji-secondary inline-flex items-center justify-center gap-2 text-base px-6 sm:px-8 py-3 sm:py-4 rounded-xl border border-dji-500/50"
              >
                Supported Drones
              </Link>
            </div>
          </div>
        </section>

        {/* Feature: Mapping */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 border-t border-dji-500/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dji-500/20 text-dji-400 text-xs font-semibold uppercase tracking-wider mb-4 font-futuristic">
                  Explore What&apos;s Possible
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 font-futuristic mb-4 flex items-center gap-3">
                  <span className="w-12 h-12 rounded-xl bg-dji-500/20 border border-dji-500/40 flex items-center justify-center">
                    <IconMap className="w-6 h-6 text-dji-400" />
                  </span>
                  Mapping
                </h2>
                <p className="text-slate-300 text-lg mb-6 font-futuristic">
                  Customize and combine Grid, Crosshatch, or Linear Maps. Terrain follow, oblique angles, overlaps, and crabwalk. 3D mission previews and flight time estimates.
                </p>
                <Link href="/sign-in" className="text-dji-400 hover:text-dji-300 font-semibold font-futuristic inline-flex items-center gap-2">
                  View example
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
              <div className="card-dji p-6 border-2 border-dji-500/20 rounded-2xl aspect-video flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <IconMap className="w-20 h-20 mx-auto mb-2 opacity-60" />
                  <span className="font-futuristic">Mission planning & 3D preview</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cross-Platform & Supported Drones */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 border-t border-dji-500/10">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dji-500/20 text-dji-400 text-xs font-semibold uppercase tracking-wider mb-4 font-futuristic">
              Cross Platform
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 font-futuristic mb-4">
              Supported Drones and Devices
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10 font-futuristic">
              Use on Web, iOS, Android, and remote controllers. One account for all devices and drones. 30+ protocols — DJI, Autel, PX4, ArduPilot, Parrot, Skydio, and more.
            </p>
            <Link
              href="/supported-drones"
              className="text-dji-400 hover:text-dji-300 font-semibold font-futuristic inline-flex items-center gap-2"
            >
              Learn more
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 border-t border-dji-500/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dji-500/20 text-dji-400 text-xs font-semibold uppercase tracking-wider mb-4 font-futuristic">
                Unlimited Possibilities
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 font-futuristic mb-4">
                Automate Data Capture for Any Use Case
              </h2>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto font-futuristic">
                Orthomosaics, point clouds, 3D models, inspections, site documentation, videography. Construction, energy, telecom, mining, agriculture, film, public safety, and more.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                'Grid, Crosshatch, Linear Maps',
                '3D mission previews & estimates',
                'Pre-plan or generate on-the-fly',
                'Link missions & automate settings',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 card-dji p-4 border border-dji-500/20 rounded-xl">
                  <IconCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200 font-futuristic text-sm sm:text-base">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Three Workflows */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 border-t border-dji-500/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dji-500/20 text-dji-400 text-xs font-semibold uppercase tracking-wider mb-4 font-futuristic">
                Multiple Levels of Automation
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 font-futuristic mb-4">
                Choose Between 3 Drone Flight Control Workflows
              </h2>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto font-futuristic">
                (1) Pre-plan missions on web or app. (2) Generate missions on-the-fly in the field. (3) Run hybrid manual/auto flight modes.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { Icon: IconMap, title: 'Pre-plan', desc: 'Design missions on web or in-app with full control over waypoints and camera settings.' },
                { Icon: IconDrone, title: 'On-the-fly', desc: 'Generate missions from current drone position for quick surveys and orbits.' },
                { Icon: IconChip, title: 'Hybrid', desc: 'Switch between manual control and automated segments seamlessly.' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="card-dji p-6 border-2 border-dji-500/20 rounded-xl hover:border-dji-500/40 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-dji-500/20 border border-dji-500/40 flex items-center justify-center text-dji-400 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 font-futuristic mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm font-futuristic">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tools for Professionals */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 border-t border-dji-500/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 card-dji p-6 border-2 border-dji-500/20 rounded-2xl aspect-video flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <IconChart className="w-20 h-20 mx-auto mb-2 opacity-60" />
                  <span className="font-futuristic">Mission management & flight logging</span>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dji-500/20 text-dji-400 text-xs font-semibold uppercase tracking-wider mb-4 font-futuristic">
                  Tools for Professionals
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 font-futuristic mb-4">
                  Enhanced Precision and Operations
                </h2>
                <p className="text-slate-300 text-lg mb-6 font-futuristic">
                  Georectify missions, adjust position and framing in real time. Mission plan and flight management for one or more pilots. Flight logging and compliance.
                </p>
                <Link href="/sign-in" className="text-dji-400 hover:text-dji-300 font-semibold font-futuristic inline-flex items-center gap-2">
                  Learn more
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-8 border-t border-dji-500/10">
          <div className="max-w-3xl mx-auto text-center card-dji p-8 sm:p-12 border-2 border-dji-500/30 rounded-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 font-futuristic mb-4">
              Sign Up Today
            </h2>
            <p className="text-slate-300 mb-6 font-futuristic">
              Select the right plan for you or your organization. Get started in minutes.
            </p>
            <Link
              href="/sign-in"
              className="btn-dji inline-flex items-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
            >
              Get Started
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
