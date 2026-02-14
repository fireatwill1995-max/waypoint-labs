'use client'

import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { logger } from '../../lib/logger'
import { formatTimestampForDisplay, handleApiError } from '../../lib/utils'

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  resource: string
  status: 'success' | 'failure' | 'warning'
  ip_address: string
  details: string
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    status: '',
    user: '',
    dateFrom: '',
    dateTo: ''
  })
  const { fetchWithAuth } = useApi()
  const { error: showError } = useToast()

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const loadLogs = async () => {
    try {
      setLoading(true)
      // Build query params safely
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, String(value))
        }
      })
      const data = await fetchWithAuth(`/api/admin/audit-logs?${params.toString()}`) as { logs?: AuditLog[] } | null
      setLogs(data?.logs || [])
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to load audit logs')
      logger.error('Failed to load audit logs:', error)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'failure':
        return 'bg-red-500/20 text-red-400'
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400'
      default:
        return 'bg-slate-500/20 text-slate-400'
    }
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
          <h2 className="text-3xl font-bold text-white mb-2">Audit Logs</h2>
          <p className="text-slate-400">System activity and security audit trail</p>
        </div>
        <button
          onClick={() => loadLogs()}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card-glass p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Action"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>
          <input
            type="text"
            placeholder="User"
            value={filters.user}
            onChange={(e) => setFilters({ ...filters, user: e.target.value })}
            className="bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="bg-slate-800 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {formatTimestampForDisplay(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {log.resource}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(log.status)}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

