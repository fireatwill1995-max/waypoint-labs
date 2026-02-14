'use client'

import Link from 'next/link'
import { IconDrone, IconCheck, IconMap, IconChip } from '../components/UIcons'

const DRONE_CATEGORIES = [
  {
    title: 'Open Source & DIY',
    desc: 'PX4, ArduPilot, Betaflight, iNav, Auterion',
    drones: ['PX4', 'ArduPilot (ArduCopter, ArduPlane, ArduRover)', 'Betaflight', 'iNav', 'AuterionOS', '3DR Solo'],
    icon: IconChip,
  },
  {
    title: 'DJI',
    desc: 'Full DJI ecosystem support',
    drones: ['DJI SDK (Matrice, Mavic, Phantom)', 'DJI Tello / Tello EDU', 'DJI Mini 2/3/4', 'DJI Air 2S/3', 'DJI FPV / Avata'],
    icon: IconDrone,
  },
  {
    title: 'Commercial & Consumer',
    desc: 'Parrot, Skydio, Autel, and more',
    drones: ['Parrot (Anafi, Bebop 2, Disco)', 'Skydio 2, X2, X10', 'Yuneec (Typhoon, Mantis, Breeze)', 'Autel EVO Lite/II/Nano', 'Holy Stone, Potensic, Walkera', 'Hubsan, Eachine, Fimi', 'PowerVision, ZeroTech'],
    icon: IconDrone,
  },
  {
    title: 'Standards & Protocols',
    desc: 'Web, cellular, satellite',
    drones: ['MAVLink', 'ROS/ROS2', 'WebRTC', 'OpenDroneID / ASTM F3411', 'LoRa', '4G/5G', 'Satellite', 'Mesh', 'RTSP/RTMP'],
    icon: IconMap,
  },
]

export default function SupportedDronesPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1a] text-readable">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1520] to-[#0f1825]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9InJnYmEoOSwxMTMsMjA2LDAuMDYpIiBmaWxsLW9wYWNpdHk9IjEiPjxjpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gradient-dji font-futuristic mb-4">
            Supported Drones & Devices
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-futuristic">
            One account. Web, iOS, Android, and remote controllers. More drones than any other flight control platform.
          </p>
        </div>

        <div className="grid gap-8 sm:gap-10">
          {DRONE_CATEGORIES.map((cat) => (
            <section
              key={cat.title}
              className="card-dji p-6 sm:p-8 border-2 border-dji-500/20 hover:border-dji-500/40 transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-dji-500/20 border border-dji-500/40 flex items-center justify-center text-dji-400">
                  <cat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-futuristic">{cat.title}</h2>
                  <p className="text-sm text-slate-400 font-futuristic">{cat.desc}</p>
                </div>
              </div>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.drones.map((name) => (
                  <li key={name} className="flex items-center gap-2 text-slate-200 text-sm sm:text-base">
                    <IconCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-12 sm:mt-16 card-dji p-6 sm:p-10 border-2 border-dji-500/30 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient-dji font-futuristic mb-4">
            Cross-Platform
          </h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto font-futuristic">
            Use on Web, iOS, Android, and compatible remote controllers. One account for all devices and drones.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 rounded-lg bg-slate-800/80 border border-dji-500/30 text-dji-300 font-futuristic">
              Web
            </span>
            <span className="px-4 py-2 rounded-lg bg-slate-800/80 border border-dji-500/30 text-dji-300 font-futuristic">
              iOS
            </span>
            <span className="px-4 py-2 rounded-lg bg-slate-800/80 border border-dji-500/30 text-dji-300 font-futuristic">
              Android
            </span>
            <span className="px-4 py-2 rounded-lg bg-slate-800/80 border border-dji-500/30 text-dji-300 font-futuristic">
              Remote controllers
            </span>
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link
            href="/sign-in"
            className="btn-dji inline-flex items-center gap-2"
          >
            Get Started
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>
      </div>
    </main>
  )
}
