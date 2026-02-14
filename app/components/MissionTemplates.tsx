'use client'

import { useState, useEffect } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface MissionTemplate {
  id: string
  name: string
  description: string
  category: string
  pattern_type: string
  tags: string[]
}

export default function MissionTemplates() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [templates, setTemplates] = useState<MissionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  useEffect(() => {
    loadTemplates()
    // Run when category filter changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      
      // Sanitize category filter
      const sanitizedCategory = categoryFilter 
        ? String(categoryFilter).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50)
        : ''
      
      const url = `/api/mission/templates${sanitizedCategory ? `?category=${encodeURIComponent(sanitizedCategory)}` : ''}`
      const response = await fetchWithAuth(url) as { templates?: MissionTemplate[] } | null
      
      // Validate response structure
      if (response && Array.isArray(response.templates)) {
        // Validate each template structure
        const validTemplates = response.templates.filter((t): t is MissionTemplate => {
          return (
            typeof t === 'object' &&
            t !== null &&
            typeof t.id === 'string' &&
            typeof t.name === 'string' &&
            typeof t.description === 'string' &&
            typeof t.category === 'string' &&
            typeof t.pattern_type === 'string' &&
            Array.isArray(t.tags)
          )
        })
        setTemplates(validTemplates)
      } else {
        setTemplates([])
      }
    } catch (err) {
      logger.error('Failed to load templates:', err)
      showError('Failed to load mission templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = (template: MissionTemplate) => {
    if (!template || !template.name) {
      showError('Invalid template')
      return
    }
    
    const templateName = String(template.name || '').slice(0, 100)
    success(`Template "${templateName}" selected. Configure parameters to generate mission.`)
    // In production, would open mission planner with template pre-filled
  }

  if (loading) {
    return (
      <div className="card-dji p-6 border-2 border-dji-500/20 rounded-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700/50 rounded-xl w-1/3" />
          <div className="h-32 bg-slate-700/50 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="card-dji p-6 border-2 border-dji-500/20 rounded-xl">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h2 className="text-xl font-bold font-futuristic text-slate-100">Mission Templates</h2>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-dji rounded-xl text-sm font-futuristic w-full sm:w-auto min-w-[160px]"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          <option value="survey">Survey</option>
          <option value="inspection">Inspection</option>
          <option value="agriculture">Agriculture</option>
          <option value="mapping">Mapping</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-slate-400 font-futuristic">No templates found. Try another category.</div>
        ) : (
          templates.map((template) => {
            if (!template || !template.id || !template.name) return null
            return (
              <div
                key={template.id}
                className="glass-dji border border-dji-500/20 rounded-xl p-4 hover:border-dji-500/40 transition-colors"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold font-futuristic text-slate-100 truncate">{String(template.name).slice(0, 100)}</h3>
                    <div className="text-sm text-slate-400 font-futuristic">{String(template.category || '').slice(0, 50)}</div>
                  </div>
                  <span className="text-xs bg-dji-500/20 text-dji-300 px-2 py-1 rounded-lg flex-shrink-0 font-futuristic">
                    {String(template.pattern_type || '').slice(0, 50)}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-3 font-futuristic line-clamp-2">{String(template.description || '').slice(0, 500)}</p>
                {template.tags && Array.isArray(template.tags) && template.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {template.tags
                      .filter((tag): tag is string => typeof tag === 'string')
                      .slice(0, 10)
                      .map((tag) => (
                        <span key={tag} className="text-xs bg-slate-700/80 text-slate-300 px-2 py-1 rounded-lg font-futuristic">
                          {String(tag).slice(0, 30)}
                        </span>
                      ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleUseTemplate(template)}
                  className="btn-dji w-full px-3 py-2 rounded-xl text-sm font-futuristic min-h-[44px]"
                  aria-label={`Use template ${template.name}`}
                >
                  Use Template
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

