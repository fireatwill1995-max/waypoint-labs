'use client'

import { IconVideo, IconChart, IconSearch } from '../UIcons'
import MultiDroneVideoManager from '../MultiDroneVideoManager'
import AnalyticsDashboard from '../AnalyticsDashboard'
import FishingAnalyticsDashboard from '../FishingAnalyticsDashboard'
import FishDetectionPanel from '../FishDetectionPanel'
import type { CivilianRightColumnTabId } from './constants'
import type { DroneInstance, Detection } from '../../types/api'

export interface CivilianRightColumnProps {
  mode: NonNullable<'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'>
  rightColumnTab: CivilianRightColumnTabId
  onRightColumnTabChange: (tab: CivilianRightColumnTabId) => void
  drones: DroneInstance[]
  onDronesChange: (drones: DroneInstance[]) => void
  detections: Detection[]
  onDetectionsChange: (detections: Detection[]) => void
  location: { lat: string; lon: string }
  onDestinationSet: (lat: string, lon: string) => void
  onSuccess: (message: string) => void
}

export function CivilianRightColumn({
  mode,
  rightColumnTab,
  onRightColumnTabChange,
  drones,
  onDronesChange,
  detections,
  onDetectionsChange,
  location,
  onDestinationSet,
  onSuccess,
}: CivilianRightColumnProps) {
  const boatLocation =
    location.lat && location.lon
      ? { lat: parseFloat(location.lat) || 0, lon: parseFloat(location.lon) || 0 }
      : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-dji-400 uppercase tracking-wider">Live Drone Feed</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
        {[
          { id: 'video' as const, label: 'Video', Icon: IconVideo },
          { id: 'analytics' as const, label: 'Analytics', Icon: IconChart },
          { id: 'detections' as const, label: 'Detections', Icon: IconSearch },
        ].map((subTab) => (
          <button
            key={subTab.id}
            onClick={() => onRightColumnTabChange(subTab.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              rightColumnTab === subTab.id
                ? 'bg-dji-500/20 text-dji-400 border border-dji-500/40'
                : 'text-on-dark-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <subTab.Icon className="w-4 h-4 flex-shrink-0" />
            <span>{subTab.label}</span>
          </button>
        ))}
      </div>
      {rightColumnTab === 'video' && (
        <div className="card-dji p-4 animate-fade-in border-2 border-dji-500/20">
          <MultiDroneVideoManager
            mode={mode}
            initialDrones={drones}
            onDronesChange={onDronesChange}
            onDetections={(_droneId, newDetections) => onDetectionsChange(newDetections)}
          />
        </div>
      )}
      {rightColumnTab === 'analytics' && (
        <div className="animate-fade-in">
          {mode === 'fishing' ? (
            <FishingAnalyticsDashboard
              detections={detections}
              drones={drones}
              boatLocation={boatLocation}
            />
          ) : (
            <AnalyticsDashboard drones={drones} detections={detections} mode={mode} />
          )}
        </div>
      )}
      {rightColumnTab === 'detections' && (
        <div className="space-y-2 animate-fade-in">
          {mode === 'fishing' ? (
            <FishDetectionPanel
              detections={detections}
              boatLocation={boatLocation}
              onNavigateToFish={(fish) => {
                if (
                  fish.location_from_boat?.bearing_degrees != null &&
                  fish.location_from_boat?.distance_meters != null
                ) {
                  const bearing = (fish.location_from_boat.bearing_degrees * Math.PI) / 180
                  const distance = (fish.location_from_boat.distance_meters || 0) / 111000
                  const boatLat = parseFloat(location.lat) || 0
                  const boatLon = parseFloat(location.lon) || 0
                  const targetLat = boatLat + distance * Math.cos(bearing)
                  const targetLon = boatLon + distance * Math.sin(bearing)
                  onDestinationSet(targetLat.toString(), targetLon.toString())
                  onSuccess(`Navigating to ${fish.species || 'fish'} location`)
                }
              }}
            />
          ) : detections.length === 0 ? (
            <div className="card-dji p-4 text-center border-2 border-dji-500/20">
              <p className="text-sm text-slate-400">No detections yet.</p>
            </div>
          ) : (
            detections.slice(0, 20).map((det, idx) => (
              <div key={idx} className="card-dji p-3 border-2 border-dji-500/20">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-dji-300">{det.label || 'Unknown'}</span>
                  {det.confidence != null && (
                    <span className="text-xs text-slate-400">{(det.confidence * 100).toFixed(0)}%</span>
                  )}
                </div>
                {det.distance != null && <p className="text-xs text-slate-500">{det.distance}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
