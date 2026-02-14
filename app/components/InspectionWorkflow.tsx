'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface InspectionReport {
  inspection_id: string
  asset_type: string
  overall_condition: string
  defects: Array<{
    id: string
    type: string
    severity: string
    description: string
  }>
  recommendations: string[]
}

export default function InspectionWorkflow() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [assetType, setAssetType] = useState('power_line')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [report, setReport] = useState<InspectionReport | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleInspect = async () => {
    if (!selectedFile) {
      showError('Please select an image')
      return
    }

    if (!selectedFile) {
      showError('Please select a file first')
      return
    }

    setIsInspecting(true)
    try {
      // Convert to base64
      const reader = new FileReader()
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
          const result = reader.result
          if (typeof result !== 'string' || !result.includes(',')) {
            logger.error('Invalid file data')
            reject(new Error('Invalid file data'))
            return
          }
          const parts = result.split(',')
          if (parts.length < 2 || !parts[1]) {
            logger.error('Failed to extract base64 data')
            reject(new Error('Failed to extract base64 data'))
            return
          }
          const base64 = parts[1]
          if (base64.length > 10 * 1024 * 1024) { // Limit to 10MB
            logger.error('File too large')
            reject(new Error('File too large (max 10MB)'))
            return
          }
            if (base64) {
              resolve(base64)
            } else {
              reject(new Error('Failed to extract base64 data'))
            }
          } else {
            reject(new Error('Invalid file read result'))
          }
        }
        reader.onerror = () => {
          reject(new Error('Failed to read file'))
        }
        reader.readAsDataURL(selectedFile)
      })

      const response = await fetchWithAuth('/api/inspection/perform', {
        method: 'POST',
        body: JSON.stringify({
          asset_type: assetType,
          image_data: imageData,
          location: { lat: 0.0, lon: 0.0 }
        })
      }) as { report: InspectionReport }

      setReport(response.report)
      success('Inspection completed!')
    } catch (err) {
      logger.error('Inspection error:', err)
      showError('Failed to perform inspection')
    } finally {
      setIsInspecting(false)
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return 'text-green-400'
      case 'fair': return 'text-yellow-400'
      case 'poor': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="card-glass p-6">
      <h2 className="text-2xl font-bold mb-4">Infrastructure Inspection</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="asset-type" className="block text-sm font-medium mb-2">Asset Type</label>
          <select
            id="asset-type"
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            aria-label="Select asset type for inspection"
          >
            <option value="power_line">Power Line</option>
            <option value="bridge">Bridge</option>
            <option value="roof">Roof</option>
            <option value="solar_panel">Solar Panel</option>
            <option value="wind_turbine">Wind Turbine</option>
            <option value="pipeline">Pipeline</option>
          </select>
        </div>

        <div>
          <label htmlFor="inspection-image" className="block text-sm font-medium mb-2">Select Inspection Image</label>
          <input
            id="inspection-image"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            aria-label="Select image file for inspection"
          />
        </div>

        <button
          onClick={handleInspect}
          disabled={isInspecting || !selectedFile}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition-colors"
          aria-label={isInspecting ? "Inspecting asset, please wait" : "Start inspection"}
          aria-busy={isInspecting}
        >
          {isInspecting ? 'Inspecting...' : 'Perform Inspection'}
        </button>

        {report && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Inspection Report</h3>
                <span className={`font-bold ${getConditionColor(report.overall_condition)}`}>
                  {report.overall_condition.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Inspection ID: {report.inspection_id}
              </div>
            </div>

            {report.defects.length > 0 && (
              <div className="p-4 bg-red-900/20 rounded border border-red-700">
                <h3 className="font-semibold mb-3 text-red-400">Defects Detected</h3>
                <div className="space-y-2">
                  {report.defects.map((defect) => (
                    <div key={defect.id} className="p-2 bg-gray-900/50 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold">{defect.type}</span>
                        <span className="text-yellow-400">{defect.severity}</span>
                      </div>
                      <div className="text-gray-400 mt-1">{defect.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.recommendations.length > 0 && (
              <div className="p-4 bg-blue-900/20 rounded border border-blue-700">
                <h3 className="font-semibold mb-3 text-blue-400">Recommendations</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  {report.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

