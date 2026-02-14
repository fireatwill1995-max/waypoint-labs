'use client'

import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { logger } from '../../lib/logger'
import { handleApiError } from '../../lib/utils'

interface ConfigSection {
  name: string
  key: string
  settings: Array<{
    key: string
    label: string
    type: 'text' | 'number' | 'boolean' | 'select'
    value: string | number | boolean
    options?: string[]
    description?: string
  }>
}

export default function SystemConfig() {
  const [config, setConfig] = useState<ConfigSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadConfig()
    // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const data = await fetchWithAuth('/api/admin/config') as { sections?: ConfigSection[] } | null
      setConfig(data?.sections || [])
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to load configuration')
      logger.error('Failed to load config:', error)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetchWithAuth('/api/admin/config', {
        method: 'POST',
        body: JSON.stringify({ sections: config })
      })
      success('Configuration saved successfully')
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to save configuration')
      logger.error('Failed to save config:', error)
      showError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (sectionKey: string, settingKey: string, value: string | number | boolean) => {
    setConfig(prev => prev.map(section => {
      if (section.key === sectionKey) {
        return {
          ...section,
          settings: section.settings.map(setting => {
            if (setting.key === settingKey) {
              return { ...setting, value }
            }
            return setting
          })
        }
      }
      return section
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">System Configuration</h2>
          <p className="text-slate-400">Manage system settings and parameters</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {config.map((section) => (
          <div key={section.key} className="card-glass p-6">
            <h3 className="text-xl font-semibold text-white mb-4">{section.name}</h3>
            <div className="space-y-4">
              {section.settings.map((setting) => (
                <div key={setting.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {setting.label}
                  </label>
                  {setting.description && (
                    <p className="text-xs text-slate-500 mb-2">{setting.description}</p>
                  )}
                  {setting.type === 'boolean' ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={typeof setting.value === 'boolean' ? setting.value : false}
                        onChange={(e) => updateSetting(section.key, setting.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      <span className="ml-3 text-sm text-slate-400">
                        {setting.value ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  ) : setting.type === 'select' ? (
                    <select
                      value={typeof setting.value === 'string' || typeof setting.value === 'number' ? String(setting.value) : ''}
                      onChange={(e) => updateSetting(section.key, setting.key, e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      {setting.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={setting.type}
                      value={typeof setting.value === 'string' || typeof setting.value === 'number' ? String(setting.value) : ''}
                      onChange={(e) => updateSetting(section.key, setting.key, setting.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

