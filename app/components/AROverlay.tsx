'use client'

import { useRef, useEffect } from 'react'
import type { Detection } from '../types/api'

interface AROverlayProps {
  videoElement: HTMLVideoElement | null
  detections: Detection[]
  showLabels?: boolean
  showDistances?: boolean
}

export default function AROverlay({ videoElement, detections, showLabels = true, showDistances = true }: AROverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!videoElement || !overlayRef.current) return

    const overlay = overlayRef.current
    const videoRect = videoElement.getBoundingClientRect()
    
    // Position overlay over video
    overlay.style.width = `${videoRect.width}px`
    overlay.style.height = `${videoRect.height}px`
    overlay.style.left = `${videoRect.left}px`
    overlay.style.top = `${videoRect.top}px`
  }, [videoElement])

  return (
    <div
      ref={overlayRef}
      className="absolute pointer-events-none z-10"
    >
      {detections.map((detection, index) => {
        if (!detection.bbox) return null
        
        const [x1, y1, x2, y2] = detection.bbox
        const width = x2 - x1
        const height = y2 - y1
        
        return (
          <div
            key={index}
            className="absolute border-2 border-cyan-400"
            style={{
              left: `${x1}px`,
              top: `${y1}px`,
              width: `${width}px`,
              height: `${height}px`,
            }}
          >
            {showLabels && detection.label && (
              <div className="absolute -top-6 left-0 px-2 py-1 bg-cyan-500/80 text-white text-xs rounded">
                {detection.label} {(detection.confidence || 0) * 100}%
              </div>
            )}
            {showDistances && detection.distance && (
              <div className="absolute -bottom-6 left-0 px-2 py-1 bg-blue-500/80 text-white text-xs rounded">
                {detection.distance}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
