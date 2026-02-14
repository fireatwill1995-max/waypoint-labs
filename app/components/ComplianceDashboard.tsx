'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface ComplianceReport {
  entity_id: string
  authority: string
  checked_at: string
  overall_status: string
  compliance_rate: number
  requirements: Record<string, {
    status: string
    checked_at: string
    violations: string[]
  }>
}

export default function ComplianceDashboard() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [entityId, setEntityId] = useState('')
  const [report, setReport] = useState<ComplianceReport | null>(null)
  const [loading, setLoading] = useState(false)

  const checkCompliance = async () => {
    if (!entityId.trim()) {
      showError('Please enter an entity ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetchWithAuth(`/api/compliance/check/${entityId}`) as { compliance: ComplianceReport }
      setReport(response.compliance)
      success('Compliance check completed')
    } catch (err) {
      logger.error('Compliance check error:', err)
      showError('Failed to check compliance')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!entityId.trim()) {
      showError('Please enter an entity ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetchWithAuth('/api/compliance/report', {
        method: 'POST',
        body: JSON.stringify({
          entity_id: entityId,
          period_days: 30,
          format: 'json'
        })
      }) as { report: ComplianceReport }

      // Download report
      const blob = new Blob([JSON.stringify(response.report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Sanitize entityId for filename
      const sanitizedEntityId = String(entityId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
      const dateStr = new Date().toISOString().split('T')[0] || 'unknown'
      a.download = `compliance_report_${sanitizedEntityId}_${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Revoke URL after a short delay to ensure download starts
      // Note: This is a short timer (100ms), cleanup happens automatically
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url)
        } catch (e) {
          // URL already revoked or invalid - ignore
        }
      }, 100)

      success('Compliance report generated and downloaded')
    } catch (err) {
      logger.error('Report generation error:', err)
      showError('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-400'
      case 'non_compliant': return 'text-red-400'
      case 'pending': return 'text-yellow-400'
      case 'expired': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="card-glass p-6">
      <h2 className="text-2xl font-bold mb-4">Compliance Management</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Entity ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Enter entity ID (pilot, drone, etc.)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2"
            />
            <button
              onClick={checkCompliance}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-4 py-2 rounded font-semibold transition-colors"
            >
              Check
            </button>
            <button
              onClick={generateReport}
              disabled={loading || !entityId}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 px-4 py-2 rounded font-semibold transition-colors"
            >
              Generate Report
            </button>
          </div>
        </div>

        {report && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Compliance Status</h3>
              <span className={`font-bold ${getStatusColor(report.overall_status)}`}>
                {report.overall_status.toUpperCase()}
              </span>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-1">Compliance Rate</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${report.compliance_rate * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold">
                  {report.compliance_rate && typeof report.compliance_rate === 'number'
                    ? (report.compliance_rate * 100).toFixed(0)
                    : '0'}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium mb-2">Requirements:</div>
              {Object.entries(report.requirements).map(([reqId, req]) => (
                <div key={reqId} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                  <span className="text-sm">{reqId.replace(/_/g, ' ')}</span>
                  <span className={`text-sm font-semibold ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

