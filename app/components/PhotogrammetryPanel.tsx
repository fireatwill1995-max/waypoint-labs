'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface PhotogrammetryResult {
  num_images: number
  num_points: number
  reprojection_error: number
  camera_poses: Record<string, number[][]>
  point_cloud: number[][]
}

export default function PhotogrammetryPanel() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<PhotogrammetryResult | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const result = reader.result
          if (typeof result !== 'string' || !result.includes(',')) {
            reject(new Error('Invalid file data'))
            return
          }
          const parts = result.split(',')
          if (parts.length < 2 || !parts[1]) {
            reject(new Error('Failed to extract base64 data'))
            return
          }
          const base64 = parts[1]
          if (base64.length > 10 * 1024 * 1024) { // Limit to 10MB
            reject(new Error('File too large (max 10MB)'))
            return
          }
          resolve(base64)
        } else {
          reject(new Error('Invalid file read result'))
        }
      }
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleReconstruct = async () => {
    if (selectedFiles.length < 2) {
      showError('Please select at least 2 images')
      return
    }

    setIsProcessing(true)
    try {
      // Convert images to base64 with error handling
      const images = await Promise.all(
        selectedFiles.map(async (file, index) => {
          try {
            // Validate file size (max 10MB per file)
            if (file.size > 10 * 1024 * 1024) {
              throw new Error(`File ${file.name} is too large (max 10MB)`)
            }
            const data = await convertFileToBase64(file)
            return {
              id: `img_${index}`,
              data: String(data || '').slice(0, 10 * 1024 * 1024) // Limit base64 length
            }
          } catch (err) {
            logger.error(`Error processing file ${file.name}:`, err)
            throw err
          }
        })
      )

      // Validate images array
      if (!Array.isArray(images) || images.length < 2) {
        showError('At least 2 valid images are required')
        setIsProcessing(false)
        return
      }
      
      const response = await fetchWithAuth('/api/photogrammetry/reconstruct', {
        method: 'POST',
        body: JSON.stringify({ images: images.slice(0, 100) }) // Limit to 100 images
      }) as { result?: PhotogrammetryResult } | null

      if (response && response.result) {
        setResult(response.result)
        success('Reconstruction completed successfully!')
      } else {
        showError('Invalid response from server')
      }
    } catch (err) {
      logger.error('Photogrammetry reconstruction error:', err)
      showError('Failed to perform reconstruction')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="card-glass p-6">
      <h2 className="text-2xl font-bold mb-4">Photogrammetry Reconstruction</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="photogrammetry-images" className="block text-sm font-medium mb-2">
            Select Images (minimum 2)
          </label>
          <input
            id="photogrammetry-images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            aria-label="Select multiple images for photogrammetry reconstruction"
          />
          {selectedFiles.length > 0 && (
            <div className="mt-2 text-sm text-gray-400">
              {selectedFiles.length} image(s) selected
            </div>
          )}
        </div>

        <button
          onClick={handleReconstruct}
          disabled={isProcessing || selectedFiles.length < 2}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition-colors"
          aria-label={isProcessing ? "Processing reconstruction, please wait" : "Start photogrammetry reconstruction"}
          aria-busy={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Start Reconstruction'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded border border-gray-700">
            <h3 className="font-semibold mb-3">Reconstruction Results</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Images Processed:</span>
                <span className="ml-2 font-semibold">{result.num_images}</span>
              </div>
              <div>
                <span className="text-gray-400">3D Points:</span>
                <span className="ml-2 font-semibold">{result.num_points}</span>
              </div>
              <div>
                <span className="text-gray-400">Reprojection Error:</span>
                <span className="ml-2 font-semibold">
                  {result.reprojection_error && typeof result.reprojection_error === 'number' && !isNaN(result.reprojection_error)
                    ? result.reprojection_error.toFixed(3)
                    : '0.000'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Camera Poses:</span>
                <span className="ml-2 font-semibold">{Object.keys(result.camera_poses).length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

