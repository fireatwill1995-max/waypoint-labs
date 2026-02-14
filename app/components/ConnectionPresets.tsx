'use client'

import { useState, useEffect } from 'react'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface AdvancedSettings {
  [key: string]: unknown
}

interface ConnectionParams {
  port?: string
  baudrate?: number
  host?: string
  portNum?: number
  url?: string
}

interface ConnectionPreset {
  id: string
  name: string
  protocol: string
  connectionType: 'serial' | 'udp' | 'tcp' | 'usb' | 'wifi' | 'bluetooth' | 'webrtc' | 'rtsp' | 'rtmp'
  connectionParams: ConnectionParams
  advancedSettings?: AdvancedSettings
  createdAt: string
  lastUsed?: string
}

interface ConnectionConfig {
  protocol?: string
  connectionType?: 'serial' | 'udp' | 'tcp' | 'usb' | 'wifi' | 'bluetooth' | 'webrtc' | 'rtsp' | 'rtmp'
  connectionParams?: ConnectionParams
  advancedSettings?: AdvancedSettings
  connection?: {
    type: 'serial' | 'udp' | 'tcp' | 'usb' | 'wifi' | 'bluetooth' | 'webrtc' | 'rtsp' | 'rtmp'
    port?: string
    baudrate?: number
    host?: string
    portNum?: number
    url?: string
  }
}

interface ConnectionPresetsProps {
  onLoadPreset: (preset: ConnectionPreset) => void
  currentConfig?: ConnectionConfig
}

export default function ConnectionPresets({
  onLoadPreset,
  currentConfig: propCurrentConfig,
}: ConnectionPresetsProps) {
  const [presets, setPresets] = useState<ConnectionPreset[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [savedConfig, setSavedConfig] = useState<ConnectionConfig | null>(null)
  const { success: showSuccess, error: showError } = useToast()

  useEffect(() => {
    loadPresets()
  }, [])

  const loadPresets = () => {
    try {
      const stored = localStorage.getItem('drone_connection_presets')
      if (stored) {
        // Validate stored data is not empty
        if (!stored.trim()) {
          setPresets([])
          return
        }
        
        const parsed = JSON.parse(stored) as unknown
        // Validate parsed data structure
        if (Array.isArray(parsed)) {
          // Additional validation: ensure each preset has required fields
          const validPresets = parsed.filter((p): p is ConnectionPreset => {
            return (
              typeof p === 'object' &&
              p !== null &&
              typeof (p as ConnectionPreset).id === 'string' &&
              typeof (p as ConnectionPreset).name === 'string' &&
              typeof (p as ConnectionPreset).protocol === 'string' &&
              typeof (p as ConnectionPreset).connectionType === 'string' &&
              typeof (p as ConnectionPreset).createdAt === 'string'
            )
          })
          setPresets(validPresets)
        } else {
          logger.warn('Invalid presets format in localStorage')
          setPresets([])
        }
      }
    } catch (error) {
      logger.error('Failed to load presets:', error)
      setPresets([])
      // Clear corrupted data
      try {
        localStorage.removeItem('drone_connection_presets')
      } catch {
        // Ignore errors clearing localStorage
      }
    }
  }

  const savePreset = (config: ConnectionConfig | null | undefined) => {
    if (!presetName.trim()) {
      showError('Please enter a preset name')
      return
    }

    if (!config) {
      showError('No configuration to save')
      return
    }

    // Sanitize preset name to prevent XSS
    const sanitizedName = presetName.trim().slice(0, 100) // Limit length

    try {
      const newPreset: ConnectionPreset = {
        id: Date.now().toString(),
        name: sanitizedName,
        protocol: (config.protocol || 'auto').slice(0, 50), // Limit length
        connectionType: config.connection?.type || config.connectionType || 'serial',
        connectionParams: config.connection || config.connectionParams || {},
        advancedSettings: config.advancedSettings,
        createdAt: new Date().toISOString(),
      }

      // Validate preset before saving
      if (!newPreset.id || !newPreset.name || !newPreset.protocol) {
        showError('Invalid preset data')
        return
      }

      const updated = [...presets, newPreset]
      // Limit total presets to prevent localStorage bloat
      const limitedPresets = updated.slice(-50) // Keep only last 50 presets
      localStorage.setItem('drone_connection_presets', JSON.stringify(limitedPresets))
      setPresets(limitedPresets)
      setShowSaveDialog(false)
      setPresetName('')
      setSavedConfig(null)
      showSuccess('Preset saved successfully')
    } catch (error) {
      showError('Failed to save preset')
      logger.error('Save preset error:', error)
    }
  }

  const deletePreset = (id: string) => {
    try {
      const updated = presets.filter((p) => p.id !== id)
      localStorage.setItem('drone_connection_presets', JSON.stringify(updated))
      setPresets(updated)
      showSuccess('Preset deleted')
    } catch (error) {
      showError('Failed to delete preset')
    }
  }

  const updateLastUsed = (id: string) => {
    try {
      const updated = presets.map((p) =>
        p.id === id ? { ...p, lastUsed: new Date().toISOString() } : p
      )
      localStorage.setItem('drone_connection_presets', JSON.stringify(updated))
      setPresets(updated)
    } catch (error) {
      logger.error('Failed to update last used:', error)
    }
  }

  const handleLoadPreset = (preset: ConnectionPreset) => {
    updateLastUsed(preset.id)
    onLoadPreset(preset)
    showSuccess(`Loaded preset: ${preset.name}`)
  }

  return (
    <div className="card-glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Connection Presets</h3>
          <p className="text-slate-400 text-sm">Save and quickly load connection configurations</p>
        </div>
        <button
          onClick={() => {
            setSavedConfig(propCurrentConfig || {})
            setShowSaveDialog(true)
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
        >
          + Save Current as Preset
        </button>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-6 max-w-md w-full space-y-4">
            <h4 className="text-xl font-bold text-white">Save Preset</h4>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Preset Name
              </label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                placeholder="e.g., My PX4 Drone"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => savePreset(savedConfig || propCurrentConfig || {})}
                className="flex-1 btn-primary py-2 font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false)
                  setPresetName('')
                  setSavedConfig(null)
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {presets.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p>No presets saved yet</p>
          <p className="text-sm mt-2">Create a preset to quickly reconnect to your drones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-white font-medium">{preset.name}</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                    {preset.protocol}
                  </span>
                  <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                    {preset.connectionType.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Created: {new Date(preset.createdAt).toLocaleDateString()}
                  {preset.lastUsed &&
                    ` • Last used: ${new Date(preset.lastUsed).toLocaleDateString()}`}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadPreset(preset)}
                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors"
                  aria-label={`Load preset ${preset.name}`}
                >
                  Load
                </button>
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                  aria-label={`Delete preset ${preset.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

