'use client'

import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { logger } from '../../lib/logger'
import { handleApiError } from '../../lib/utils'

interface SecuritySettings {
  two_factor_enabled: boolean
  session_timeout: number
  password_policy: {
    min_length: number
    require_uppercase: boolean
    require_lowercase: boolean
    require_numbers: boolean
    require_special: boolean
  }
  ip_whitelist: string[]
  rate_limiting: {
    enabled: boolean
    requests_per_minute: number
  }
  encryption: {
    algorithm: string
    key_rotation_interval: number
  }
}

export default function SecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newIpAddress, setNewIpAddress] = useState('')
  const { fetchWithAuth } = useApi()
  const { success, error: showError, warning } = useToast()

  useEffect(() => {
    loadSettings()
    // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await fetchWithAuth('/api/admin/security') as SecuritySettings | null
      setSettings(data)
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to load security settings')
      logger.error('Failed to load security settings:', error)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await fetchWithAuth('/api/admin/security', {
        method: 'POST',
        body: JSON.stringify(settings)
      })
      success('Security settings saved successfully')
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to save security settings')
      logger.error('Failed to save security settings:', error)
      showError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const validateIpAddress = (ip: string): boolean => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-9]|[1-2][0-9]|3[0-2])$/
    return ipRegex.test(ip) || cidrRegex.test(ip)
  }

  const handleAddIp = () => {
    if (!settings) return
    
    const trimmedIp = newIpAddress.trim()
    if (!trimmedIp) {
      warning('Please enter an IP address')
      return
    }
    
    if (!validateIpAddress(trimmedIp)) {
      showError('Invalid IP address format. Use IPv4 (e.g., 192.168.1.1) or CIDR (e.g., 192.168.1.0/24)')
      return
    }
    
    if (settings.ip_whitelist.includes(trimmedIp)) {
      warning('IP address already in whitelist')
      return
    }
    
    setSettings({
      ...settings,
      ip_whitelist: [...settings.ip_whitelist, trimmedIp]
    })
    setNewIpAddress('')
    success('IP address added to whitelist')
  }

  const handleRemoveIp = (ip: string) => {
    if (!settings) return
    
    setSettings({
      ...settings,
      ip_whitelist: settings.ip_whitelist.filter(item => item !== ip)
    })
    success('IP address removed from whitelist')
  }

  const updateSetting = (path: string, value: string | number | boolean) => {
    if (!settings) return
    const keys = path.split('.')
    const newSettings = { ...settings }
    // Use Record<string, unknown> for nested object traversal
    let current: Record<string, unknown> = newSettings as Record<string, unknown>
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!key) continue
      const nextValue = current[key]
      if (nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue)) {
        current[key] = { ...(nextValue as Record<string, unknown>) }
        current = current[key] as Record<string, unknown>
      } else {
        // Create new object if path doesn't exist
        current[key] = {}
        current = current[key] as Record<string, unknown>
      }
    }
    const lastKey = keys[keys.length - 1]
    if (lastKey) {
      current[lastKey] = value
    }
    
    setSettings(newSettings)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="card-glass p-6 border-red-500/50">
        <p className="text-red-400">Failed to load security settings</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Security Settings</h2>
          <p className="text-slate-400">Configure system security and access controls</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Authentication */}
      <div className="card-glass p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Authentication</h3>
        <div className="space-y-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.two_factor_enabled}
              onChange={(e) => updateSetting('two_factor_enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            <span className="ml-3 text-sm text-slate-300">Enable Two-Factor Authentication</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.session_timeout}
              onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Password Policy */}
      <div className="card-glass p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Password Policy</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Minimum Length
            </label>
            <input
              type="number"
              value={settings.password_policy.min_length}
              onChange={(e) => updateSetting('password_policy.min_length', parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.password_policy.require_uppercase}
              onChange={(e) => updateSetting('password_policy.require_uppercase', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            <span className="ml-3 text-sm text-slate-300">Require Uppercase</span>
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.password_policy.require_numbers}
              onChange={(e) => updateSetting('password_policy.require_numbers', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            <span className="ml-3 text-sm text-slate-300">Require Numbers</span>
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.password_policy.require_special}
              onChange={(e) => updateSetting('password_policy.require_special', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            <span className="ml-3 text-sm text-slate-300">Require Special Characters</span>
          </label>
        </div>
      </div>

      {/* IP Whitelist */}
      <div className="card-glass p-6">
        <h3 className="text-xl font-semibold text-white mb-4">IP Whitelist</h3>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Manage IP addresses that are allowed to access the system. Leave empty to allow all IPs.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter IP address (e.g., 192.168.1.1 or 192.168.1.0/24)"
              value={newIpAddress}
              onChange={(e) => setNewIpAddress(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddIp()
                }
              }}
              className="flex-1 bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleAddIp}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add IP
            </button>
          </div>
          {settings.ip_whitelist.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-300 mb-2">
                Whitelisted IPs ({settings.ip_whitelist.length})
              </div>
              <div className="space-y-2">
                {settings.ip_whitelist.map((ip) => (
                  <div
                    key={ip}
                    className="flex items-center justify-between bg-slate-800/50 border border-white/10 rounded px-4 py-2"
                  >
                    <span className="text-sm text-white font-mono">{ip}</span>
                    <button
                      onClick={() => handleRemoveIp(ip)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic">
              No IP addresses whitelisted. All IPs are allowed.
            </div>
          )}
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="card-glass p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Rate Limiting</h3>
        <div className="space-y-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.rate_limiting.enabled}
              onChange={(e) => updateSetting('rate_limiting.enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            <span className="ml-3 text-sm text-slate-300">Enable Rate Limiting</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Requests Per Minute
            </label>
            <input
              type="number"
              value={settings.rate_limiting.requests_per_minute}
              onChange={(e) => updateSetting('rate_limiting.requests_per_minute', parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Encryption */}
      <div className="card-glass p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Encryption</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Algorithm
            </label>
            <select
              value={settings.encryption.algorithm}
              onChange={(e) => updateSetting('encryption.algorithm', e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="AES-256">AES-256</option>
              <option value="AES-192">AES-192</option>
              <option value="AES-128">AES-128</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Key Rotation Interval (hours)
            </label>
            <input
              type="number"
              value={settings.encryption.key_rotation_interval}
              onChange={(e) => updateSetting('encryption.key_rotation_interval', parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

