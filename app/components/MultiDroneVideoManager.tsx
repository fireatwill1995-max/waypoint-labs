'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import ResizableVideoPlayer from './ResizableVideoPlayer'
import DroneCommandPanel from './DroneCommandPanel'
import type { DroneInstance, VideoSettings, Detection } from '../types/api'

interface MultiDroneVideoManagerProps {
  mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'
  onDetections?: (droneId: string, detections: Detection[]) => void
  initialDrones?: DroneInstance[]
  onDronesChange?: (drones: DroneInstance[]) => void
}

export default function MultiDroneVideoManager({
  mode,
  onDetections,
  initialDrones,
  onDronesChange,
}: MultiDroneVideoManagerProps) {
  const [drones, setDrones] = useState<DroneInstance[]>(initialDrones || [])
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null)
  const [layout, setLayout] = useState<'grid' | 'split' | 'focus'>('grid')
  const prevDronesRef = useRef<DroneInstance[]>(initialDrones || [])
  const onDronesChangeRef = useRef(onDronesChange)

  // Keep ref updated
  useEffect(() => {
    onDronesChangeRef.current = onDronesChange
  }, [onDronesChange])

  useEffect(() => {
    if (initialDrones && initialDrones.length > 0) {
      setDrones(initialDrones)
      if (!selectedDrone && initialDrones.length > 0) {
        const firstDrone = initialDrones[0]
        if (firstDrone && firstDrone.id) {
          setSelectedDrone(firstDrone.id)
        }
      }
    }
  }, [initialDrones, selectedDrone])

  // Only call onDronesChange when drones actually change (not just reference)
  useEffect(() => {
    // Optimized comparison without JSON.stringify for better performance
    const dronesChanged = 
      prevDronesRef.current.length !== drones.length ||
      prevDronesRef.current.some((prevDrone, index) => {
        const currentDrone = drones[index]
        if (!currentDrone) return true
        
        // Compare primitive properties first (faster)
        if (prevDrone.id !== currentDrone.id ||
            prevDrone.status !== currentDrone.status) {
          return true
        }
        
        // Deep compare videoSettings object properties
        const prevSettings = prevDrone.videoSettings
        const currSettings = currentDrone.videoSettings
        if (!prevSettings && !currSettings) return false
        if (!prevSettings || !currSettings) return true
        
        // Compare each property individually (faster than JSON.stringify)
        return (
          prevSettings.brightness !== currSettings.brightness ||
          prevSettings.contrast !== currSettings.contrast ||
          prevSettings.saturation !== currSettings.saturation ||
          prevSettings.flipHorizontal !== currSettings.flipHorizontal ||
          prevSettings.flipVertical !== currSettings.flipVertical
        )
      })

    if (dronesChanged && onDronesChangeRef.current) {
      prevDronesRef.current = drones
      onDronesChangeRef.current(drones)
    } else {
      prevDronesRef.current = drones
    }
  }, [drones])

  const addDrone = useCallback(() => {
    const droneId = `drone_${Date.now()}`
    const cameraId = `webcam_${drones.length}`
    const newDrone: DroneInstance = {
      id: droneId,
      name: `Drone ${drones.length + 1}`,
      cameraId,
      status: 'ready',
      videoSettings: {
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        zoom: 1.0,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      },
    }
    setDrones((prev) => [...prev, newDrone])
    if (drones.length === 0) {
      setSelectedDrone(droneId)
    }
  }, [drones.length])

  const removeDrone = useCallback((droneId: string) => {
    setDrones((prev) => {
      const filtered = prev.filter((d) => d.id !== droneId)
      // Update selected drone if needed
      if (selectedDrone === droneId) {
        const newSelected = filtered.length > 0 && filtered[0] ? filtered[0].id : null
        setSelectedDrone(newSelected)
      }
      return filtered
    })
  }, [selectedDrone])

  const duplicateDrone = useCallback((droneId: string) => {
    const drone = drones.find((d) => d.id === droneId)
    if (drone && drone.id) {
      const newDroneId = `drone_${Date.now()}`
      const newCameraId = `webcam_${drones.length}`
      const newDrone: DroneInstance = {
        ...drone,
        id: newDroneId,
        name: `${drone.name || 'Drone'} (Copy)`,
        cameraId: newCameraId,
        videoSettings: drone.videoSettings || {
          brightness: 1.0,
          contrast: 1.0,
          saturation: 1.0,
          zoom: 1.0,
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
        },
      }
      setDrones((prev) => [...prev, newDrone])
    }
  }, [drones])

  const updateDroneSettings = useCallback((droneId: string, settings: VideoSettings) => {
    setDrones((prev) =>
      prev.map((d) => (d.id === droneId ? { ...d, videoSettings: settings } : d))
    )
  }, [])

  const handleDetections = useCallback((droneId: string, detections: Detection[]) => {
    if (onDetections) {
      onDetections(droneId, detections)
    }
  }, [onDetections])

  const handleResize = useCallback((_droneId: string, _size: { width: number; height: number }) => {
    // Store resize info if needed
  }, [])

  if (drones.length === 0) {
    return (
      <div className="card-glass p-8 text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">No Drones Active</h3>
          <p className="text-slate-400 mb-6">Add your first drone to start monitoring</p>
        </div>
        <button onClick={addDrone} className="btn-primary">
          Add First Drone
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="card-glass p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={addDrone} className="btn-primary text-sm">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Drone
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Layout:</span>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as 'grid' | 'split' | 'focus')}
              className="glass border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="grid">Grid</option>
              <option value="split">Split</option>
              <option value="focus">Focus</option>
            </select>
          </div>
          <div className="text-sm text-slate-400">
            Active: <span className="text-white font-semibold">{drones.length}</span> drone{drones.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {drones.map((drone) => (
            <button
              key={drone.id}
              onClick={() => setSelectedDrone(drone.id)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedDrone === drone.id
                  ? 'bg-blue-500 text-white'
                  : 'glass border border-white/20 text-slate-300 hover:border-blue-500/50'
              }`}
            >
              {drone.name}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div
        className={`grid gap-4 ${
          layout === 'grid'
            ? drones.length === 1
              ? 'grid-cols-1'
              : drones.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-3'
            : layout === 'split'
            ? 'grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        {drones.map((drone) => {
          const isFocused = layout === 'focus' && selectedDrone === drone.id
          const isHidden = layout === 'focus' && selectedDrone !== drone.id

          if (isHidden) return null

          return (
            <div
              key={drone.id}
              className={`relative ${
                isFocused ? 'col-span-full' : ''
              }`}
            >
              <div className="card-glass p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{drone.name}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        drone.status === 'ready'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : drone.status === 'mission'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {drone.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => duplicateDrone(drone.id)}
                      className="p-1 glass border border-white/20 rounded hover:border-blue-500/50 transition-colors"
                      title="Duplicate"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {drones.length > 1 && (
                      <button
                        onClick={() => removeDrone(drone.id)}
                        className="p-1 glass border border-white/20 rounded hover:border-red-500/50 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <ResizableVideoPlayer
                  cameraId={drone.cameraId}
                  mode={mode}
                  droneId={drone.id}
                  droneName={drone.name}
                  initialSettings={drone.videoSettings}
                  onSettingsChange={(settings) => updateDroneSettings(drone.id, settings)}
                  onDetections={(detections) => handleDetections(drone.id, detections)}
                  onResize={(size) => handleResize(drone.id, size)}
                />
              </div>
              {selectedDrone === drone.id && (
                <div className="mt-2">
                  <DroneCommandPanel drone={drone} mode={mode} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
