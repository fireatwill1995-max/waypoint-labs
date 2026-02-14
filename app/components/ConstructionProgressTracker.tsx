'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface ProgressResult {
  completion_percent: number
  date: string
  changes_detected: string[]
}

export default function ConstructionProgressTracker() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [isTracking, setIsTracking] = useState(false)
  const [progress, setProgress] = useState<ProgressResult | null>(null)

  const handleTrackProgress = async () => {
    setIsTracking(true)
    try {
      // In production, would upload DEM files
      const response = await fetchWithAuth('/api/construction/track-progress', {
        method: 'POST',
        body: JSON.stringify({
          current_dem: [], // Would be actual DEM data
          baseline_dem: [], // Would be actual DEM data
          bounds: [0, 0, 100, 100],
          resolution: 0.1
        })
      }) as { progress: ProgressResult }

      setProgress(response.progress)
      success('Progress tracked successfully!')
    } catch (err) {
      logger.error('Progress tracking error:', err)
      showError('Failed to track progress')
    } finally {
      setIsTracking(false)
    }
  }

  return (
    <div className="card-glass p-6">
      <h2 className="text-2xl font-bold mb-4">Construction Progress Tracking</h2>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-400">
          Upload DEM files to track construction progress over time
        </div>

        <button
          onClick={handleTrackProgress}
          disabled={isTracking}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition-colors"
        >
          {isTracking ? 'Tracking...' : 'Track Progress'}
        </button>

        {progress && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Progress Status</h3>
              <div className="text-3xl font-bold text-blue-400">
                {typeof progress.completion_percent === 'number' && !isNaN(progress.completion_percent)
                  ? progress.completion_percent.toFixed(1)
                  : '0.0'}%
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex-1 bg-gray-700 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all"
                  style={{ 
                    width: `${typeof progress.completion_percent === 'number' && !isNaN(progress.completion_percent)
                      ? Math.min(100, Math.max(0, progress.completion_percent))
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            {progress.changes_detected && Array.isArray(progress.changes_detected) && progress.changes_detected.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Changes Detected:</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  {progress.changes_detected.map((change, i) => (
                    <li key={i}>{change}</li>
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

