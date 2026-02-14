'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { logger } from '../lib/logger'

interface GestureControlProps {
  onGesture?: (gesture: string) => void
  enabled?: boolean
}

interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'longpress' | 'rotate'
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  center?: { x: number; y: number }
}

export default function GestureControl({ onGesture, enabled = true }: GestureControlProps) {
  const [isActive, setIsActive] = useState(false)
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null)
  const [touchMode, setTouchMode] = useState(true) // Mobile-first
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const touchStartDistanceRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !isActive) return

    // Capture ref at effect start so cleanup uses same reference (satisfies react-hooks/exhaustive-deps)
    const videoElForCleanup = videoRef.current
    let mounted = true

    const setupGestureRecognition = async () => {
      try {
        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          logger.warn('MediaDevices API not available')
          return
        }
        
        // Access webcam with proper error handling
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        })
        
        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream
        } else {
          // Component unmounted, stop the stream
          stream.getTracks().forEach(track => track.stop())
        }
      } catch (error) {
        if (mounted) {
          logger.error('Error accessing webcam:', error)
          // Don't show error to user - gesture control is optional
        }
      }
    }

    setupGestureRecognition()

    return () => {
      mounted = false
      // Use ref captured at effect start; stream may be set async in setupGestureRecognition
      if (videoElForCleanup?.srcObject) {
        const stream = videoElForCleanup.srcObject as MediaStream
        stream.getTracks().forEach(track => {
          try {
            track.stop()
          } catch (e) {
            // Ignore errors during cleanup
          }
        })
        videoElForCleanup.srcObject = null
      }
    }
  }, [enabled, isActive])

  // Touch gesture detection
  const detectTouchGesture = useCallback(
    (gesture: TouchGesture) => {
      let command = ''

      switch (gesture.type) {
        case 'swipe':
          if (gesture.direction === 'up') command = 'move_forward'
          else if (gesture.direction === 'down') command = 'move_backward'
          else if (gesture.direction === 'left') command = 'move_left'
          else if (gesture.direction === 'right') command = 'move_right'
          break
        case 'pinch':
          if (gesture.distance && gesture.distance > 0) command = 'zoom_in'
          else command = 'zoom_out'
          break
        case 'tap':
          command = 'select_target'
          break
        case 'longpress':
          command = 'confirm_action'
          break
        case 'rotate':
          command = 'rotate_gimbal'
          break
      }

      if (command && onGesture) {
        setDetectedGesture(command)
        onGesture(command)
      }
    },
    [onGesture]
  )

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isActive || !touchMode) return

    const touch = e.touches[0]
    if (!touch) return
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }

    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      if (!touch1 || !touch2) return
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      touchStartDistanceRef.current = distance
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isActive || !touchMode || !touchStartRef.current) return

    const touch = e.changedTouches[0]
    if (!touch) return
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time
    const distance = Math.hypot(deltaX, deltaY)

    // Detect gesture type
    if (e.touches.length === 0 && e.changedTouches.length === 1) {
      // Single touch
      if (deltaTime > 500) {
        // Long press
        detectTouchGesture({ type: 'longpress', center: { x: touch.clientX, y: touch.clientY } })
      } else if (distance > 50) {
        // Swipe
        const absX = Math.abs(deltaX)
        const absY = Math.abs(deltaY)
        let direction: 'up' | 'down' | 'left' | 'right'

        if (absX > absY) {
          direction = deltaX > 0 ? 'right' : 'left'
        } else {
          direction = deltaY > 0 ? 'down' : 'up'
        }

        detectTouchGesture({
          type: 'swipe',
          direction,
          distance,
          center: { x: touch.clientX, y: touch.clientY },
        })
      } else {
        // Tap
        detectTouchGesture({ type: 'tap', center: { x: touch.clientX, y: touch.clientY } })
      }
    } else if (e.touches.length === 1 && touchStartDistanceRef.current) {
      // Pinch
      const touch1 = e.touches[0]
      const touch2 = e.changedTouches[0]
      if (!touch1 || !touch2) return
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      const delta = currentDistance - touchStartDistanceRef.current

      detectTouchGesture({
        type: 'pinch',
        distance: delta,
        center: {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        },
      })
    }

    touchStartRef.current = null
    touchStartDistanceRef.current = null
  }

  const toggleActive = () => {
    setIsActive(!isActive)
  }

  return (
    <div className="card-glass p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">Gesture Control</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTouchMode(!touchMode)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              touchMode
                ? 'bg-blue-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {touchMode ? 'Touch' : 'Camera'}
          </button>
          <button
            onClick={toggleActive}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isActive ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      {isActive && (
        <div className="space-y-3">
          {touchMode ? (
            <div
              className="relative w-full h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden border-2 border-blue-500/50 flex items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">👆</div>
                <div className="text-white font-semibold">Touch Gesture Area</div>
                <div className="text-slate-400 text-sm mt-2">
                  Swipe, tap, pinch, or long press
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="absolute inset-0" />
            </div>
          )}

          {detectedGesture && (
            <div className="glass border border-blue-500/30 rounded-lg p-3 animate-pulse">
              <div className="text-sm text-blue-300 font-semibold">
                Detected: {detectedGesture.replace(/_/g, ' ').toUpperCase()}
              </div>
            </div>
          )}

          <div className="text-xs text-slate-400">
            <p className="font-semibold mb-1">
              {touchMode ? 'Touch gestures:' : 'Camera gestures:'}
            </p>
            {touchMode ? (
              <ul className="list-disc list-inside space-y-1">
                <li>Swipe up: Move forward</li>
                <li>Swipe down: Move backward</li>
                <li>Swipe left/right: Move sideways</li>
                <li>Tap: Select target</li>
                <li>Long press: Confirm action</li>
                <li>Pinch: Zoom in/out</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                <li>Open hand: Move forward</li>
                <li>Closed fist: Stop</li>
                <li>Point: Select target</li>
                <li>Thumbs up: Confirm</li>
              </ul>
            )}
          </div>
        </div>
      )}

      {!isActive && (
        <div className="text-sm text-slate-400">
          Click &quot;Start&quot; to enable gesture control. Uses webcam for hand tracking.
        </div>
      )}
    </div>
  )
}
