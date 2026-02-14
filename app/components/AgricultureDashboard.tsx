'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface AgricultureAnalysis {
  ndvi: {
    mean: number
    min: number
    max: number
    healthy_area_percent: number
    stressed_area_percent: number
    dead_area_percent: number
  }
  health: {
    overall_score: number
    healthy_area_percent: number
    stressed_area_percent: number
    disease_area_percent: number
    issues: Array<{
      type: string
      severity: number
      description: string
      recommendation: string
    }>
    recommendations: string[]
  }
  analyzed_at: string
}

export default function AgricultureDashboard() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AgricultureAnalysis | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
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
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      showError('Please select an image')
      return
    }

    setIsAnalyzing(true)
    try {
      const rgbImage = await convertFileToBase64(selectedFile)

      const response = await fetchWithAuth('/api/agriculture/analyze', {
        method: 'POST',
        body: JSON.stringify({
          rgb_image: rgbImage,
          location: [0.0, 0.0] // Would get from user input
        })
      }) as { analysis: AgricultureAnalysis }

      setAnalysis(response.analysis)
      success('Field analysis completed!')
    } catch (err) {
      logger.error('Agriculture analysis error:', err)
      showError('Failed to analyze field')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="card-glass p-6">
      <h2 className="text-2xl font-bold mb-4">Precision Agriculture Analysis</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Field Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !selectedFile}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition-colors"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Field'}
        </button>

        {analysis && (
          <div className="mt-6 space-y-4">
            {/* NDVI Results */}
            <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
              <h3 className="font-semibold mb-3">NDVI Analysis</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Mean NDVI:</span>
                  <span className="ml-2 font-semibold">
                    {analysis.ndvi?.mean && typeof analysis.ndvi.mean === 'number' && !isNaN(analysis.ndvi.mean)
                      ? analysis.ndvi.mean.toFixed(3)
                      : '0.000'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Range:</span>
                  <span className="ml-2 font-semibold">{analysis.ndvi.min.toFixed(3)} - {analysis.ndvi.max.toFixed(3)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Healthy Area:</span>
                  <span className="ml-2 font-semibold text-green-400">
                    {analysis.ndvi?.healthy_area_percent && typeof analysis.ndvi.healthy_area_percent === 'number' && !isNaN(analysis.ndvi.healthy_area_percent)
                      ? analysis.ndvi.healthy_area_percent.toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Stressed Area:</span>
                  <span className="ml-2 font-semibold text-yellow-400">{analysis.ndvi.stressed_area_percent.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Health Results */}
            <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Crop Health</h3>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-400">Overall Score:</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {analysis.health?.overall_score && typeof analysis.health.overall_score === 'number' && !isNaN(analysis.health.overall_score)
                      ? (analysis.health.overall_score * 100).toFixed(0)
                      : '0'}%
                  </div>
                </div>
              </div>
              
              {analysis.health.issues.length > 0 && (
                <div className="space-y-2 mb-3">
                  <div className="text-sm font-medium">Issues Detected:</div>
                  {analysis.health.issues.map((issue, i) => (
                    <div key={i} className="p-2 bg-gray-900/50 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold">{issue.type}</span>
                        <span className="text-yellow-400">
                          Severity: {issue.severity && typeof issue.severity === 'number' && !isNaN(issue.severity)
                            ? (issue.severity * 100).toFixed(0)
                            : '0'}%
                        </span>
                      </div>
                      <div className="text-gray-400 mt-1">{issue.description}</div>
                      <div className="text-blue-400 mt-1 text-xs">💡 {issue.recommendation}</div>
                    </div>
                  ))}
                </div>
              )}

              {analysis.health.recommendations.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Recommendations:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {analysis.health.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

