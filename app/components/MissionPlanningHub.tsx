'use client'

import { useState } from 'react'
import CesiumMissionView from './CesiumMissionView'
import MissionPatternGenerator from './MissionPatternGenerator'
import MissionTemplates from './MissionTemplates'
import { IconMap, IconClock, IconChart, IconSparkles } from './UIcons'
import type { Waypoint, DroneInstance } from '../types/api'

interface MissionPlanningHubProps {
  waypoints: Waypoint[]
  drones: DroneInstance[]
  mode?: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'
  onWaypointsChange: (waypoints: Waypoint[]) => void
  onWaypointAdd?: (wp: Waypoint) => void
  onWaypointUpdate?: (wp: Waypoint) => void
  onWaypointDelete?: (id: string) => void
}

/** Dronelink-style hub: mapping, 3D preview, mission estimates, link missions. */
export default function MissionPlanningHub({
  waypoints,
  drones,
  mode,
  onWaypointsChange: _onWaypointsChange,
  onWaypointAdd,
  onWaypointUpdate,
  onWaypointDelete,
}: MissionPlanningHubProps) {
  const [activeSection, setActiveSection] = useState<'map' | '3d' | 'patterns' | 'templates'>('3d')

  // Approximate mission estimates from waypoints (Dronelink-style)
  const totalDistanceKm = waypoints.length >= 2
    ? waypoints.slice(1).reduce((acc, wp, i) => {
        const prev = waypoints[i]
        if (!prev) return acc
        const R = 6371 // Earth radius km
        const dLat = ((wp.lat - prev.lat) * Math.PI) / 180
        const dLon = ((wp.lon - prev.lon) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((prev.lat * Math.PI) / 180) * Math.cos((wp.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return acc + R * c
      }, 0)
    : 0
  const estimatedMinutes = totalDistanceKm > 0 ? Math.ceil((totalDistanceKm / 0.05) * 60) : 0 // ~5 m/s nominal
  const estimatedImages = waypoints.length > 0 ? Math.max(1, Math.ceil(totalDistanceKm * 100)) : 0

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: '3d' as const, label: '3D Mission Preview', Icon: IconMap },
          { id: 'map' as const, label: 'Mapping & Patterns', Icon: IconChart },
          { id: 'templates' as const, label: 'Mission Templates', Icon: IconSparkles },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
              activeSection === id
                ? 'bg-dji-500/30 text-dji-300 border-2 border-dji-500/50'
                : 'glass-dji border border-dji-500/20 text-slate-400 hover:text-slate-200 hover:border-dji-500/40'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Mission estimates (Dronelink-style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-dji p-4 border border-dji-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-dji-400/80 text-xs font-futuristic uppercase tracking-wider mb-1">
            <IconMap className="w-4 h-4" />
            Waypoints
          </div>
          <div className="text-2xl font-bold text-slate-100 font-futuristic">{waypoints.length}</div>
        </div>
        <div className="card-dji p-4 border border-dji-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-dji-400/80 text-xs font-futuristic uppercase tracking-wider mb-1">
            Distance
          </div>
          <div className="text-2xl font-bold text-slate-100 font-futuristic">
            {totalDistanceKm.toFixed(2)} km
          </div>
        </div>
        <div className="card-dji p-4 border border-dji-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-dji-400/80 text-xs font-futuristic uppercase tracking-wider mb-1">
            <IconClock className="w-4 h-4" />
            Est. time
          </div>
          <div className="text-2xl font-bold text-slate-100 font-futuristic">
            ~{estimatedMinutes} min
          </div>
        </div>
        <div className="card-dji p-4 border border-dji-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-dji-400/80 text-xs font-futuristic uppercase tracking-wider mb-1">
            <IconChart className="w-4 h-4" />
            Est. images
          </div>
          <div className="text-2xl font-bold text-slate-100 font-futuristic">~{estimatedImages}</div>
        </div>
      </div>

      {/* Content */}
      {activeSection === '3d' && (
        <div className="card-dji p-4 border-2 border-dji-500/20 rounded-xl">
          <h3 className="text-lg font-bold text-slate-100 font-futuristic mb-3">3D Mission Preview & Estimates</h3>
          <p className="text-slate-400 text-sm mb-4 font-futuristic">
            Preview the flight path in 3D. Add or edit waypoints to see updated estimates.
          </p>
          <div className="h-80 rounded-lg overflow-hidden bg-slate-900/80">
            <CesiumMissionView
              waypoints={waypoints}
              drones={drones}
              mode={mode}
              onWaypointAdd={onWaypointAdd}
              onWaypointUpdate={onWaypointUpdate}
              onWaypointDelete={onWaypointDelete}
            />
          </div>
        </div>
      )}

      {activeSection === 'map' && (
        <div className="card-dji p-4 border-2 border-dji-500/20 rounded-xl">
          <h3 className="text-lg font-bold text-slate-100 font-futuristic mb-3">Mapping & Pattern Generator</h3>
          <p className="text-slate-400 text-sm mb-4 font-futuristic">
            Grid, Crosshatch, Linear, Lawnmower, Spiral, Zigzag, or Terrain Following. Terrain follow, oblique angles, overlaps.
          </p>
          <MissionPatternGenerator />
        </div>
      )}

      {activeSection === 'templates' && (
        <div className="card-dji p-4 border-2 border-dji-500/20 rounded-xl">
          <h3 className="text-lg font-bold text-slate-100 font-futuristic mb-3">Mission Templates</h3>
          <p className="text-slate-400 text-sm mb-4 font-futuristic">
            Start from templates and customize. Link multiple mission components into one.
          </p>
          <MissionTemplates />
        </div>
      )}
    </div>
  )
}
