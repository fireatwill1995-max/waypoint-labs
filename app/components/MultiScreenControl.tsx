'use client'

import { useState, useEffect } from 'react'
import { logger } from '../lib/logger'

interface ScreenLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
  content: string
  minimized: boolean
}

export default function MultiScreenControl() {
  const [screens, setScreens] = useState<ScreenLayout[]>([])
  const [layoutMode, setLayoutMode] = useState<'auto' | 'manual'>('auto')
  const [detectedScreens, setDetectedScreens] = useState<number>(1)

  useEffect(() => {
    // Detect available screens
    const detectScreens = () => {
      // In production, would use Screen API
      if ('getScreenDetails' in window) {
        // Type assertion for experimental Screen API
        interface ScreenDetails {
          screens: Array<{ id: string; width: number; height: number }>
        }
        interface WindowWithScreenDetails extends Window {
          getScreenDetails?: () => Promise<ScreenDetails>
        }
        const getScreenDetails = (window as unknown as WindowWithScreenDetails).getScreenDetails
        if (getScreenDetails) {
          getScreenDetails().then((screenDetails) => {
            setDetectedScreens(screenDetails.screens.length)
          }).catch(() => {
            setDetectedScreens(1)
          })
        } else {
          setDetectedScreens(1)
        }
      } else {
        setDetectedScreens(1)
      }
    }

    detectScreens()

    // Initialize default screens
    const defaultScreens: ScreenLayout[] = [
      { id: '1', x: 0, y: 0, width: 50, height: 50, content: 'video', minimized: false },
      { id: '2', x: 50, y: 0, width: 50, height: 50, content: 'telemetry', minimized: false },
      { id: '3', x: 0, y: 50, width: 50, height: 50, content: 'map', minimized: false },
      { id: '4', x: 50, y: 50, width: 50, height: 50, content: 'analytics', minimized: false },
    ]
    setScreens(defaultScreens)
  }, [])

  const addScreen = (content: string) => {
    try {
      if (!content || typeof content !== 'string') {
        return
      }
      
      // Sanitize content
      const sanitizedContent = String(content).slice(0, 50)
      
      // Limit total screens to prevent performance issues
      if (screens.length >= 16) {
        logger.error('Maximum screen limit reached (16)')
        return
      }
      
      const newScreen: ScreenLayout = {
        id: `screen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: Math.max(0, Math.min(100, (screens.length % 2) * 50)),
        y: Math.max(0, Math.min(100, Math.floor(screens.length / 2) * 50)),
        width: Math.max(10, Math.min(100, 50)),
        height: Math.max(10, Math.min(100, 50)),
        content: sanitizedContent,
        minimized: false
      }
      setScreens((prev) => [...prev, newScreen])
    } catch (error) {
      logger.error('Error adding screen:', error)
    }
  }

  const removeScreen = (id: string) => {
    try {
      if (!id) return
      setScreens((prev) => prev.filter(s => s.id !== id))
    } catch (error) {
      logger.error('Error removing screen:', error)
    }
  }

  const toggleMinimize = (id: string) => {
    try {
      if (!id) return
      setScreens((prev) => prev.map(s => s.id === id ? { ...s, minimized: !s.minimized } : s))
    } catch (error) {
      logger.error('Error toggling minimize:', error)
    }
  }

  const applyLayout = (preset: string) => {
    try {
      if (!preset || typeof preset !== 'string') {
        return
      }
      const layouts: Record<string, ScreenLayout[]> = {
        'single': [
          { id: '1', x: 0, y: 0, width: 100, height: 100, content: 'video', minimized: false }
        ],
        'split': [
          { id: '1', x: 0, y: 0, width: 50, height: 100, content: 'video', minimized: false },
          { id: '2', x: 50, y: 0, width: 50, height: 100, content: 'telemetry', minimized: false }
        ],
        'quad': [
          { id: '1', x: 0, y: 0, width: 50, height: 50, content: 'video', minimized: false },
          { id: '2', x: 50, y: 0, width: 50, height: 50, content: 'telemetry', minimized: false },
          { id: '3', x: 0, y: 50, width: 50, height: 50, content: 'map', minimized: false },
          { id: '4', x: 50, y: 50, width: 50, height: 50, content: 'analytics', minimized: false }
        ]
      }
      
      if (layouts[preset]) {
        setScreens(layouts[preset])
      }
    } catch (error) {
      logger.error('Error applying layout:', error)
    }
  }

  return (
    <div className="card-glass p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Multi-Screen Mission Control</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Detected: {detectedScreens} screen(s)</span>
          <select
            value={layoutMode}
            onChange={(e) => setLayoutMode(e.target.value as 'auto' | 'manual')}
            className="glass border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="auto">Auto Layout</option>
            <option value="manual">Manual Layout</option>
          </select>
        </div>
      </div>

      {/* Layout Presets */}
      <div className="mb-6">
        <div className="text-sm text-slate-400 mb-3">Layout Presets:</div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => applyLayout('single')} className="btn-secondary text-sm">
            Single
          </button>
          <button onClick={() => applyLayout('split')} className="btn-secondary text-sm">
            Split
          </button>
          <button onClick={() => applyLayout('quad')} className="btn-secondary text-sm">
            Quad
          </button>
        </div>
      </div>

      {/* Add Screen Options */}
      <div className="mb-6">
        <div className="text-sm text-slate-400 mb-3">Add Screen:</div>
        <div className="flex gap-2 flex-wrap">
          {['video', 'telemetry', 'map', 'analytics', 'detections', 'chat'].map((content) => (
            <button
              key={content}
              onClick={() => addScreen(content)}
              className="btn-secondary text-sm capitalize"
            >
              + {content}
            </button>
          ))}
        </div>
      </div>

      {/* Screen Grid */}
      <div className="relative w-full h-96 border border-white/10 rounded-lg overflow-hidden">
        {screens.map((screen) => (
          <div
            key={screen.id}
            className="absolute glass border border-blue-500/50 rounded-lg p-2 cursor-move"
            style={{
              left: `${screen.x}%`,
              top: `${screen.y}%`,
              width: `${screen.width}%`,
              height: `${screen.height}%`,
              display: screen.minimized ? 'none' : 'block'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white capitalize">{screen.content}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleMinimize(screen.id)}
                  className="w-5 h-5 flex items-center justify-center text-xs text-slate-400 hover:text-white"
                >
                  {screen.minimized ? '□' : '−'}
                </button>
                <button
                  onClick={() => removeScreen(screen.id)}
                  className="w-5 h-5 flex items-center justify-center text-xs text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
              {screen.content} View
            </div>
          </div>
        ))}
      </div>

      {/* Screen Info */}
      <div className="mt-4 text-sm text-slate-400">
        Active Screens: {screens.filter(s => !s.minimized).length} / {screens.length}
      </div>
    </div>
  )
}
