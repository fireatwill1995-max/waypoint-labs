'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface VolumeResult {
  volume_m3: number
  area_m2: number
  average_height_m: number
  max_height_m: number
  min_height_m: number
  confidence: number
}

interface StockpileResult {
  volume_m3: number
  area_m2: number
  shape: string
  peak_height_m: number
  mass_kg: number | null
  material: string | null
}

export default function VolumetricTool() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [calculationType, setCalculationType] = useState<'dem' | 'stockpile'>('dem')
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<VolumeResult | StockpileResult | null>(null)

  const handleDEMCalculation = async () => {
    setIsCalculating(true)
    try {
      // In production, would upload DEM file or use existing DEM
      // For now, use placeholder data
      const demData = {
        type: 'dem',
        dem: [], // Would be actual DEM array
        reference_level: 0.0,
        bounds: [0, 0, 100, 100],
        resolution: 0.1
      }

      const response = await fetchWithAuth('/api/analytics/volumetric/calculate', {
        method: 'POST',
        body: JSON.stringify(demData)
      }) as { volume: VolumeResult }

      setResult(response.volume)
      success('Volume calculated successfully!')
    } catch (err) {
      logger.error('Volume calculation error:', err)
      showError('Failed to calculate volume')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleStockpileCalculation = async () => {
    setIsCalculating(true)
    try {
      const stockpileData = {
        type: 'stockpile',
        point_cloud: [], // Would be actual point cloud
        material_type: 'gravel'
      }

      const response = await fetchWithAuth('/api/analytics/volumetric/calculate', {
        method: 'POST',
        body: JSON.stringify(stockpileData)
      }) as { stockpile: StockpileResult }

      setResult(response.stockpile)
      success('Stockpile volume calculated successfully!')
    } catch (err) {
      logger.error('Stockpile calculation error:', err)
      showError('Failed to calculate stockpile volume')
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="card-glass p-6">
      <h2 className="text-2xl font-bold mb-4">Volumetric Analysis</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Calculation Type</label>
          <select
            value={calculationType}
            onChange={(e) => {
              setCalculationType(e.target.value as 'dem' | 'stockpile')
              setResult(null)
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
          >
            <option value="dem">DEM Volume</option>
            <option value="stockpile">Stockpile Volume</option>
          </select>
        </div>

        <button
          onClick={calculationType === 'dem' ? handleDEMCalculation : handleStockpileCalculation}
          disabled={isCalculating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition-colors"
        >
          {isCalculating ? 'Calculating...' : 'Calculate Volume'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded border border-gray-700">
            <h3 className="font-semibold mb-3">Results</h3>
            {'volume_m3' in result ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume:</span>
                  <span className="font-semibold">{result.volume_m3.toFixed(2)} m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Area:</span>
                  <span className="font-semibold">{result.area_m2.toFixed(2)} m²</span>
                </div>
                {'average_height_m' in result && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Height:</span>
                    <span className="font-semibold">{result.average_height_m.toFixed(2)} m</span>
                  </div>
                )}
                {'shape' in result && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shape:</span>
                      <span className="font-semibold">{result.shape}</span>
                    </div>
                    {result.mass_kg && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mass:</span>
                        <span className="font-semibold">{(result.mass_kg / 1000).toFixed(2)} tons</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

