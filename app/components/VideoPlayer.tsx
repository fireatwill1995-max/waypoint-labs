'use client'

import { useEffect, useRef, useState, memo } from 'react'
import { logger } from '../lib/logger'
import type { Detection } from '../types/api'

interface VideoPlayerProps {
  cameraId: string
  mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'
  onDetections?: (detections: Detection[]) => void
}

function VideoPlayer({ cameraId, mode, onDetections }: VideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const detectionsRef = useRef<Detection[]>([]) // Ref to track latest detections for drawing
  const wsVideoRef = useRef<WebSocket | null>(null)
  const wsDetectionsRef = useRef<WebSocket | null>(null)
  
  // Keep ref in sync with state
  useEffect(() => {
    detectionsRef.current = detections
  }, [detections])

  useEffect(() => {
    // Only use WebSocket if URL is properly configured
    const WS_BASE_URL = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_WS_URL || '')
      : ''
    
    // Validate WebSocket URL
    if (!WS_BASE_URL || !WS_BASE_URL.startsWith('ws')) {
      setError('WebSocket URL not configured')
      return
    }
    
    // Sanitize cameraId to prevent injection
    const sanitizedCameraId = String(cameraId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100)
    if (!sanitizedCameraId) {
      setError('Invalid camera ID')
      return
    }
    
    const wsVideoUrl = `${WS_BASE_URL}/ws/video/${sanitizedCameraId}`
    const wsDetectionsUrl = `${WS_BASE_URL}/ws/civilian/detections`

    let isMounted = true
    let wsVideo: WebSocket | null = null
    let wsDetections: WebSocket | null = null

    // Helper function to safely close WebSocket
    const safeClose = (ws: WebSocket | null) => {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        try {
          ws.close()
        } catch (e) {
          // Ignore errors during cleanup - this is expected in React Strict Mode
        }
      }
    }

    // Connect to video stream
    try {
      // Validate URL before creating WebSocket
      if (!wsVideoUrl.startsWith('ws://') && !wsVideoUrl.startsWith('wss://')) {
        throw new Error('Invalid WebSocket URL')
      }
      
      wsVideo = new WebSocket(wsVideoUrl)
      wsVideoRef.current = wsVideo

      wsVideo.onopen = () => {
        if (isMounted) {
          setIsConnected(true)
          setError(null)
        }
      }

      wsVideo.onmessage = (event) => {
        if (!isMounted) return
        try {
          if (!event.data || typeof event.data !== 'string') {
            logger.warn('Invalid WebSocket message data')
            return
          }
            const data = JSON.parse(event.data) as { type?: string; data?: string; message?: string }
          if (data.type === 'frame' && data.data) {
            // Validate base64 data
            const base64Data = String(data.data || '').trim()
            if (!base64Data || base64Data.length > 10 * 1024 * 1024) { // Limit to 10MB
              logger.warn('Invalid or too large frame data')
              return
            }
            
            const img = new Image()
            img.onerror = () => {
              if (isMounted) {
                logger.error('Failed to load video frame image')
              }
            }
            img.onload = () => {
              if (!isMounted) return
              const canvas = canvasRef.current
              if (canvas) {
                const ctx = canvas.getContext('2d')
                if (ctx) {
                  // Validate image dimensions
                  if (img.width <= 0 || img.height <= 0 || img.width > 10000 || img.height > 10000) {
                    logger.warn('Invalid image dimensions')
                    return
                  }
                  canvas.width = img.width
                  canvas.height = img.height
                  ctx.drawImage(img, 0, 0)
                  
                  // Draw detection boxes with modern styling
                  // Use ref to get latest detections (avoids stale closure)
                  const currentDetections = detectionsRef.current
                  currentDetections.forEach((det) => {
                    if (det.bbox && Array.isArray(det.bbox) && det.bbox.length >= 4) {
                      const [x1, y1, x2, y2] = det.bbox
                      // Validate bbox values are numbers
                      if (typeof x1 !== 'number' || typeof y1 !== 'number' || 
                          typeof x2 !== 'number' || typeof y2 !== 'number') {
                        return
                      }
                      const width = x2 - x1
                      const height = y2 - y1
                      // Validate dimensions are positive
                      if (width <= 0 || height <= 0) {
                        return
                      }
                      
                      // Determine color based on mode
                      const color = mode === 'cattle' ? '#10b981' : mode === 'hunting' ? '#f59e0b' : mode === 'filming' ? '#a855f7' : mode === 'mining' ? '#f97316' : '#3b82f6'
                      
                      // Draw shadow for depth
                      ctx.shadowColor = color
                      ctx.shadowBlur = 10
                      ctx.shadowOffsetX = 0
                      ctx.shadowOffsetY = 0
                      
                      // Draw border with gradient effect
                      ctx.strokeStyle = color
                      ctx.lineWidth = 3
                      ctx.strokeRect(x1, y1, width, height)
                      
                      // Reset shadow
                      ctx.shadowBlur = 0
                      
                      // Draw label background with glassmorphism effect
                      const labelText = `${det.label || 'Unknown'} (${((det.confidence || 0) * 100).toFixed(0)}%)`
                      ctx.font = 'bold 14px Inter, system-ui, sans-serif'
                      const textMetrics = ctx.measureText(labelText)
                      const textWidth = textMetrics.width
                      const textHeight = 20
                      
                      // Semi-transparent background
                      ctx.fillStyle = `${color}40`
                      ctx.fillRect(x1, y1 - textHeight - 4, textWidth + 12, textHeight + 4)
                      
                      // Border for label
                      ctx.strokeStyle = color
                      ctx.lineWidth = 1
                      ctx.strokeRect(x1, y1 - textHeight - 4, textWidth + 12, textHeight + 4)
                      
                      // Draw label text
                      ctx.fillStyle = '#ffffff'
                      ctx.font = 'bold 14px Inter, system-ui, sans-serif'
                      ctx.fillText(labelText, x1 + 6, y1 - 8)
                    }
                  })
                }
              }
            }
            img.src = `data:image/jpeg;base64,${data.data}`
          } else if (data.type === 'error') {
            if (isMounted) {
              setError(data.message ?? null)
            }
          }
        } catch (e) {
          logger.error('Error processing video frame:', e)
        }
      }

      wsVideo.onerror = () => {
        // Only log errors if component is still mounted and it's not a cleanup-related error
        if (isMounted && wsVideo?.readyState !== WebSocket.CLOSING && wsVideo?.readyState !== WebSocket.CLOSED) {
          setError('Failed to connect to video stream')
          setIsConnected(false)
        }
      }

      wsVideo.onclose = () => {
        if (isMounted) {
          setIsConnected(false)
        }
      }
    } catch (e) {
      if (isMounted) {
        setError('Failed to create video WebSocket connection')
        setIsConnected(false)
      }
    }

    // Connect to detections stream
    try {
      // Validate URL before creating WebSocket
      if (!wsDetectionsUrl.startsWith('ws://') && !wsDetectionsUrl.startsWith('wss://')) {
        throw new Error('Invalid WebSocket URL')
      }
      
      wsDetections = new WebSocket(wsDetectionsUrl)
      wsDetectionsRef.current = wsDetections

      wsDetections.onopen = () => {
        if (isMounted && wsDetections) {
          wsDetections.send(JSON.stringify({ type: 'set_mode', mode }))
        }
      }

      wsDetections.onmessage = (event) => {
        if (!isMounted) return
        try {
          if (!event.data || typeof event.data !== 'string') {
            logger.warn('Invalid detections WebSocket message data')
            return
          }
          const data = JSON.parse(event.data) as { type?: string; detections?: unknown }
          if (data.type === 'detections') {
            // Validate detections array structure
            const rawDetections = data.detections
            const newDetections = Array.isArray(rawDetections) 
              ? rawDetections.filter((det): det is Detection => {
                  return (
                    typeof det === 'object' &&
                    det !== null &&
                    (!('label' in det) || typeof det.label === 'string') &&
                    (!('confidence' in det) || (typeof det.confidence === 'number' && det.confidence >= 0 && det.confidence <= 1))
                  )
                })
              : []
            setDetections(newDetections)
            detectionsRef.current = newDetections // Update ref immediately
            if (onDetections) {
              onDetections(newDetections)
            }
          }
        } catch (e) {
          logger.error('Error processing detections:', e)
        }
      }

      wsDetections.onerror = () => {
        // Only log errors if component is still mounted and it's not a cleanup-related error
        if (isMounted && wsDetections?.readyState !== WebSocket.CLOSING && wsDetections?.readyState !== WebSocket.CLOSED) {
          logger.error('Detections stream error')
        }
      }

      wsDetections.onclose = () => {
        // Cleanup handled in return function
      }
    } catch (e) {
      if (isMounted) {
        logger.error('Failed to create detections WebSocket connection:', e)
        setError('Failed to connect to detections stream')
      }
    }

    return () => {
      isMounted = false
      safeClose(wsVideo)
      safeClose(wsDetections)
      wsVideoRef.current = null
      wsDetectionsRef.current = null
    }
  }, [cameraId, mode, onDetections])

  return (
    <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700/50">
      <canvas
        ref={canvasRef}
        className="w-full h-auto max-h-[600px] block"
        aria-label={`Video stream from camera ${cameraId}`}
        role="img"
      />
      
      {/* Modern connection status badge */}
      <div className="absolute top-4 right-4">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-xl border ${
            isConnected
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : 'bg-red-500/20 border-red-500/50 text-red-400'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className="text-sm font-semibold">
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Error message with modern styling */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 glass-strong border border-red-500/50 text-red-400 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Detection count badge */}
      {detections.length > 0 && (
        <div className="absolute top-4 left-4 glass-strong border border-blue-500/50 text-blue-400 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-semibold">
              {detections.length} detection{detections.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!isConnected && !error && (
        <div className="absolute inset-0 flex items-center justify-center glass">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-medium">Connecting to video stream...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(VideoPlayer)