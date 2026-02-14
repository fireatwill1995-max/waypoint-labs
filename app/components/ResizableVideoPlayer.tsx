'use client'

import { useEffect, useRef, useState, memo, useCallback } from 'react'
import { logger } from '../lib/logger'
import type { Detection, VideoSettings } from '../types/api'

interface ResizableVideoPlayerProps {
  cameraId: string
  mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'
  droneId?: string
  droneName?: string
  onDetections?: (detections: Detection[]) => void
  onSettingsChange?: (settings: VideoSettings) => void
  initialSettings?: VideoSettings
  resizable?: boolean
  defaultSize?: { width: number; height: number }
  onResize?: (size: { width: number; height: number }) => void
}

const defaultSettings: VideoSettings = {
  brightness: 1.0,
  contrast: 1.0,
  saturation: 1.0,
  zoom: 1.0,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
}

function ResizableVideoPlayer({
  cameraId,
  mode,
  droneName,
  onDetections,
  onSettingsChange,
  initialSettings,
  resizable = true,
  defaultSize = { width: 800, height: 600 },
  onResize,
}: ResizableVideoPlayerProps) {
  // droneId is available via props but not used in this component
  // It's kept in the interface for API compatibility
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const detectionsRef = useRef<Detection[]>([]) // Ref to track latest detections for drawing
  const [settings, setSettings] = useState<VideoSettings>(initialSettings || defaultSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [size, setSize] = useState(defaultSize)
  const wsVideoRef = useRef<WebSocket | null>(null)
  const wsDetectionsRef = useRef<WebSocket | null>(null)
  
  // Keep ref in sync with state
  useEffect(() => {
    detectionsRef.current = detections
  }, [detections])

  // Apply video settings to canvas
  const applyVideoSettings = useCallback((ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    if (!canvasRef.current) return
    
    ctx.save()
    
    // Apply transformations
    const centerX = canvasRef.current.width / 2
    const centerY = canvasRef.current.height / 2
    
    ctx.translate(centerX, centerY)
    const rotation = typeof settings.rotation === 'number' && !isNaN(settings.rotation) 
      ? settings.rotation 
      : 0
    ctx.rotate((rotation * Math.PI) / 180)
    const flipH = typeof settings.flipHorizontal === 'boolean' ? settings.flipHorizontal : false
    const flipV = typeof settings.flipVertical === 'boolean' ? settings.flipVertical : false
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    ctx.translate(-centerX, -centerY)
    
    // Apply zoom with validation
    const scale = typeof settings.zoom === 'number' && !isNaN(settings.zoom) && settings.zoom > 0
      ? Math.min(5, Math.max(0.1, settings.zoom))
      : 1.0
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale
    const offsetX = (canvasRef.current.width - scaledWidth) / 2
    const offsetY = (canvasRef.current.height - scaledHeight) / 2
    
    // Draw image
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)
    
    // Apply brightness, contrast, saturation using imageData manipulation
    const brightness = typeof settings.brightness === 'number' && !isNaN(settings.brightness)
      ? Math.max(0, Math.min(2, settings.brightness))
      : 1.0
    const contrast = typeof settings.contrast === 'number' && !isNaN(settings.contrast)
      ? Math.max(0, Math.min(2, settings.contrast))
      : 1.0
    const saturation = typeof settings.saturation === 'number' && !isNaN(settings.saturation)
      ? Math.max(0, Math.min(2, settings.saturation))
      : 1.0
    
    if (brightness !== 1.0 || contrast !== 1.0 || saturation !== 1.0) {
      const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        if (r === undefined || g === undefined || b === undefined) {
          continue
        }
        
        // Brightness
        const rBright = Math.min(255, r * settings.brightness)
        const gBright = Math.min(255, g * settings.brightness)
        const bBright = Math.min(255, b * settings.brightness)
        
        // Contrast
        const factor = (259 * (settings.contrast * 255 + 255)) / (255 * (259 - settings.contrast * 255))
        const rContrast = Math.min(255, Math.max(0, factor * (rBright - 128) + 128))
        const gContrast = Math.min(255, Math.max(0, factor * (gBright - 128) + 128))
        const bContrast = Math.min(255, Math.max(0, factor * (bBright - 128) + 128))
        
        // Saturation (simplified)
        const gray = 0.299 * rContrast + 0.587 * gContrast + 0.114 * bContrast
        data[i] = Math.min(255, gray + (rContrast - gray) * settings.saturation)
        data[i + 1] = Math.min(255, gray + (gContrast - gray) * settings.saturation)
        data[i + 2] = Math.min(255, gray + (bContrast - gray) * settings.saturation)
      }
      
      ctx.putImageData(imageData, 0, 0)
    }
    
    ctx.restore()
  }, [settings])

  useEffect(() => {
    // Only use WebSocket if URL is properly configured
    const WS_BASE_URL = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_WS_URL || '')
      : ''
    
    // Validate WebSocket URL
    if (!WS_BASE_URL || !WS_BASE_URL.startsWith('ws')) {
      setError('WebSocket URL not configured')
      return () => {
        // Cleanup function
      }
    }
    
    // Sanitize cameraId to prevent injection
    const sanitizedCameraId = String(cameraId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100)
    if (!sanitizedCameraId) {
      setError('Invalid camera ID')
      return () => {
        // Cleanup function
      }
    }
    
    const wsVideoUrl = `${WS_BASE_URL}/ws/video/${sanitizedCameraId}`
    const wsDetectionsUrl = `${WS_BASE_URL}/ws/civilian/detections`

    let isMounted = true
    let wsVideo: WebSocket | null = null
    let wsDetections: WebSocket | null = null

    const safeClose = (ws: WebSocket | null) => {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        try {
          ws.close()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }

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
                  // Validate size values
                  const validWidth = typeof size.width === 'number' && size.width > 0 && size.width <= 10000 ? size.width : 800
                  const validHeight = typeof size.height === 'number' && size.height > 0 && size.height <= 10000 ? size.height : 600
                  
                  canvas.width = validWidth
                  canvas.height = validHeight
                  
                  // Validate image dimensions
                  if (img.width <= 0 || img.height <= 0 || img.width > 10000 || img.height > 10000) {
                    logger.warn('Invalid image dimensions')
                    return
                  }
                  
                  // Clear canvas
                  ctx.clearRect(0, 0, canvas.width, canvas.height)
                  
                  // Draw image with settings applied
                  applyVideoSettings(ctx, img)
                  
                  // Draw detection boxes - use ref to avoid stale closure
                  const currentDetections = detectionsRef.current
                  if (Array.isArray(currentDetections)) {
                    currentDetections.forEach((det) => {
                      if (det.bbox && Array.isArray(det.bbox) && det.bbox.length >= 4) {
                        const [x1, y1, x2, y2] = det.bbox
                        // Validate bbox values
                        if (typeof x1 !== 'number' || typeof y1 !== 'number' || 
                            typeof x2 !== 'number' || typeof y2 !== 'number') {
                          return
                        }
                        const width = x2 - x1
                        const height = y2 - y1
                        // Validate dimensions
                        if (width <= 0 || height <= 0 || width > canvas.width || height > canvas.height) {
                          return
                        }
                        
                        const color = mode === 'cattle' ? '#10b981' : mode === 'hunting' ? '#f59e0b' : mode === 'filming' ? '#a855f7' : mode === 'mining' ? '#f97316' : '#3b82f6'
                        
                        ctx.strokeStyle = color
                        ctx.lineWidth = 3
                        ctx.strokeRect(x1, y1, width, height)
                        
                        const label = String(det.label || 'Unknown').slice(0, 50) // Limit label length
                        const confidence = typeof det.confidence === 'number' ? det.confidence : 0
                        const labelText = `${label} (${(confidence * 100).toFixed(0)}%)`
                        ctx.font = 'bold 14px Inter, system-ui, sans-serif'
                        const textMetrics = ctx.measureText(labelText)
                        const textHeight = 20
                        
                        ctx.fillStyle = `${color}40`
                        ctx.fillRect(x1, y1 - textHeight - 4, textMetrics.width + 12, textHeight + 4)
                        
                        ctx.strokeStyle = color
                        ctx.lineWidth = 1
                        ctx.strokeRect(x1, y1 - textHeight - 4, textMetrics.width + 12, textHeight + 4)
                        
                        ctx.fillStyle = '#ffffff'
                        ctx.fillText(labelText, x1 + 6, y1 - 8)
                      }
                    })
                  }
                }
              }
            }
            img.src = `data:image/jpeg;base64,${base64Data}`
          } else if (data.type === 'error') {
            if (isMounted) {
              const errorMsg = String(data.message || 'Unknown error').slice(0, 500)
              setError(errorMsg)
            }
          }
        } catch (e) {
          logger.error('Error processing video frame:', e)
        }
      }

      wsVideo.onerror = () => {
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

    try {
      // Validate URL before creating WebSocket
      if (!wsDetectionsUrl.startsWith('ws://') && !wsDetectionsUrl.startsWith('wss://')) {
        throw new Error('Invalid WebSocket URL')
      }
      
      wsDetections = new WebSocket(wsDetectionsUrl)
      wsDetectionsRef.current = wsDetections

      wsDetections.onopen = () => {
        if (isMounted && wsDetections) {
          try {
            wsDetections.send(JSON.stringify({ type: 'set_mode', mode }))
          } catch (err) {
            logger.error('Failed to send mode to detections WebSocket:', err)
          }
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
        if (isMounted && wsDetections?.readyState !== WebSocket.CLOSING && wsDetections?.readyState !== WebSocket.CLOSED) {
          logger.error('Detections stream error')
        }
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
    // Reconnect when camera/mode/size change; callbacks intentionally omitted to avoid re-connection churn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraId, mode, size.width, size.height])

  const handleSettingsChange = (newSettings: Partial<VideoSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    if (onSettingsChange) {
      onSettingsChange(updated)
    }
  }

  // Store event handlers in refs to ensure cleanup works correctly
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const mouseUpHandlerRef = useRef<(() => void) | null>(null)
  
  // Cleanup event listeners on unmount or when resizing state changes
  useEffect(() => {
    return () => {
      // Cleanup any remaining event listeners
      if (mouseMoveHandlerRef.current) {
        document.removeEventListener('mousemove', mouseMoveHandlerRef.current)
        mouseMoveHandlerRef.current = null
      }
      if (mouseUpHandlerRef.current) {
        document.removeEventListener('mouseup', mouseUpHandlerRef.current)
        mouseUpHandlerRef.current = null
      }
    }
  }, [])
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!resizable) return
    e.preventDefault()
    setIsResizing(true)
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height

    const handleMouseMove = (e: MouseEvent) => {
      // Validate mouse coordinates
      if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number' || 
          isNaN(e.clientX) || isNaN(e.clientY)) {
        return
      }
      
      // Validate start values
      const safeStartWidth = typeof startWidth === 'number' && !isNaN(startWidth) ? startWidth : 800
      const safeStartHeight = typeof startHeight === 'number' && !isNaN(startHeight) ? startHeight : 600
      const safeStartX = typeof startX === 'number' && !isNaN(startX) ? startX : 0
      const safeStartY = typeof startY === 'number' && !isNaN(startY) ? startY : 0
      
      const newWidth = Math.max(400, Math.min(1920, safeStartWidth + (e.clientX - safeStartX)))
      const newHeight = Math.max(300, Math.min(1080, safeStartHeight + (e.clientY - safeStartY)))
      
      // Validate calculated dimensions
      if (typeof newWidth === 'number' && !isNaN(newWidth) && 
          typeof newHeight === 'number' && !isNaN(newHeight)) {
        setSize({ width: newWidth, height: newHeight })
        if (onResize) {
          onResize({ width: newWidth, height: newHeight })
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (mouseMoveHandlerRef.current) {
        document.removeEventListener('mousemove', mouseMoveHandlerRef.current)
        mouseMoveHandlerRef.current = null
      }
      if (mouseUpHandlerRef.current) {
        document.removeEventListener('mouseup', mouseUpHandlerRef.current)
        mouseUpHandlerRef.current = null
      }
    }

    // Store handlers in refs for cleanup
    mouseMoveHandlerRef.current = handleMouseMove
    mouseUpHandlerRef.current = handleMouseUp

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [resizable, size.width, size.height, onResize])

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700/50"
      style={{ width: size.width, height: size.height }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: size.width, height: size.height }}
      />
      
      {/* Drone name badge */}
      {droneName && (
        <div className="absolute top-4 left-4 glass-strong border border-blue-500/50 text-blue-400 px-4 py-2 rounded-lg">
          <span className="text-sm font-semibold">{droneName}</span>
        </div>
      )}

      {/* Connection status */}
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

      {/* Settings button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-4 right-20 glass-strong border border-white/20 hover:border-blue-500/50 text-white px-3 py-2 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 glass-strong border border-white/20 rounded-xl p-4 w-64 z-50">
          <h3 className="text-white font-semibold mb-4">Video Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Brightness: {typeof settings.brightness === 'number' && !isNaN(settings.brightness)
                  ? settings.brightness.toFixed(2)
                  : '1.00'}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.brightness}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (!isNaN(value) && value >= 0 && value <= 2) {
                    handleSettingsChange({ brightness: value })
                  }
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Contrast: {typeof settings.contrast === 'number' && !isNaN(settings.contrast)
                  ? settings.contrast.toFixed(2)
                  : '1.00'}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.contrast}
                onChange={(e) => handleSettingsChange({ contrast: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Saturation: {typeof settings.saturation === 'number' && !isNaN(settings.saturation)
                  ? settings.saturation.toFixed(2)
                  : '1.00'}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.saturation}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (!isNaN(value) && value >= 0 && value <= 2) {
                    handleSettingsChange({ saturation: value })
                  }
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Zoom: {typeof settings.zoom === 'number' && !isNaN(settings.zoom)
                  ? settings.zoom.toFixed(2)
                  : '1.00'}x
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={settings.zoom}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (!isNaN(value) && value >= 0.1 && value <= 5) {
                    handleSettingsChange({ zoom: value })
                  }
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Rotation: {typeof settings.rotation === 'number' && !isNaN(settings.rotation)
                  ? settings.rotation
                  : 0}°
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={settings.rotation}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  if (!isNaN(value) && value >= -180 && value <= 180) {
                    handleSettingsChange({ rotation: value })
                  }
                }}
                className="w-full"
              />
            </div>
            <div className="flex gap-4">
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.flipHorizontal}
                  onChange={(e) => handleSettingsChange({ flipHorizontal: e.target.checked })}
                />
                Flip H
              </label>
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.flipVertical}
                  onChange={(e) => handleSettingsChange({ flipVertical: e.target.checked })}
                />
                Flip V
              </label>
            </div>
            <button
              onClick={() => {
                setSettings(defaultSettings)
                if (onSettingsChange) {
                  onSettingsChange(defaultSettings)
                }
              }}
              className="btn-secondary w-full text-sm"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      {/* Resize handle */}
      {resizable && (
        <div
          onMouseDown={handleMouseDown}
          className={`absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-blue-500/50 hover:bg-blue-500/70 transition-colors ${
            isResizing ? 'bg-blue-500' : ''
          }`}
          style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
        />
      )}

      {/* Error message */}
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

      {/* Detection count */}
      {detections.length > 0 && (
        <div className="absolute bottom-4 left-4 glass-strong border border-blue-500/50 text-blue-400 px-4 py-2 rounded-lg">
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

export default memo(ResizableVideoPlayer)
