'use client'

import { useState, useEffect } from 'react'
import { logger } from '../lib/logger'

interface VRMissionControlProps {
  drones: Array<{ id: string; name: string; position?: { lat: number; lon: number; alt: number } }>
  waypoints: Array<{ id: string; lat: number; lon: number; alt: number }>
}

export default function VRMissionControl({ drones: _drones, waypoints: _waypoints }: VRMissionControlProps) {
  const [vrSupported, setVrSupported] = useState(false)
  const [isVRActive, setIsVRActive] = useState(false)

  useEffect(() => {
    let mounted = true
    
    // Check for WebXR support
    if (typeof window !== 'undefined' && 'xr' in navigator) {
      try {
        const xr = (navigator as Navigator & { xr?: { isSessionSupported?: (mode: string) => Promise<boolean> } }).xr
        if (xr && typeof xr.isSessionSupported === 'function') {
          xr.isSessionSupported('immersive-vr')
            .then((supported: boolean) => {
              if (mounted) {
                setVrSupported(Boolean(supported))
              }
            })
            .catch((error: unknown) => {
              if (mounted) {
                logger.error('WebXR check failed:', error)
                setVrSupported(false)
              }
            })
        } else {
          setVrSupported(false)
        }
      } catch (error) {
        logger.error('WebXR initialization error:', error)
        if (mounted) {
          setVrSupported(false)
        }
      }
    } else {
      setVrSupported(false)
    }
    
    return () => {
      mounted = false
    }
  }, [])

  const enterVR = async () => {
    try {
      // @ts-ignore
      const session = await navigator.xr?.requestSession('immersive-vr')
      setIsVRActive(true)
      // In production, would render 3D scene in VR
    } catch (error) {
      logger.error('Failed to enter VR:', error)
    }
  }

  if (!vrSupported) {
    return (
      <div className="card-glass p-4 border border-yellow-500/50">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm text-yellow-400 font-semibold">VR Not Supported</p>
            <p className="text-xs text-slate-400">Your browser doesn&apos;t support WebXR</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass p-6">
      <h3 className="text-xl font-bold text-white mb-4">VR Mission Control</h3>
      
      {!isVRActive ? (
        <div className="text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-300 mb-4">Enter immersive VR mission control</p>
          </div>
          <button onClick={enterVR} className="btn-primary">
            Enter VR Mode
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-green-400 mb-4">VR Session Active</p>
          <button onClick={() => setIsVRActive(false)} className="btn-danger">
            Exit VR
          </button>
        </div>
      )}

      <div className="mt-6 text-sm text-slate-400">
        <p className="font-semibold mb-2">VR Features:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>3D mission visualization</li>
          <li>Hand tracking controls</li>
          <li>Immersive drone monitoring</li>
          <li>Natural interaction</li>
        </ul>
      </div>
    </div>
  )
}
