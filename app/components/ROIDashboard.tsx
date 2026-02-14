'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'

interface ROIAnalysis {
  total_cost: number
  total_revenue: number
  total_savings: number
  roi_percent: number
  payback_period_days: number | null
  missions_completed: number
  efficiency_metrics: {
    cost_per_hour: number
    cost_per_mission: number
    missions_per_day: number
    average_flight_time: number
  }
}

export default function ROIDashboard() {
  const { fetchWithAuth } = useApi()
  const { success, error: showError } = useToast()
  const [isCalculating, setIsCalculating] = useState(false)
  const [roi, setRoi] = useState<ROIAnalysis | null>(null)
  const [missions, _setMissions] = useState<Array<{ flight_time_hours: number }>>([])
  const [revenuePerMission, setRevenuePerMission] = useState('')
  const [savingsPerMission, setSavingsPerMission] = useState('')

  const handleCalculate = async () => {
    setIsCalculating(true)
    try {
      const periodStart = new Date()
      periodStart.setDate(periodStart.getDate() - 30) // Last 30 days
      const periodEnd = new Date()

      const response = await fetchWithAuth('/api/analytics/roi/calculate', {
        method: 'POST',
        body: JSON.stringify({
          missions: missions.length > 0 ? missions : [
            { flight_time_hours: 2.5 },
            { flight_time_hours: 3.0 },
            { flight_time_hours: 1.8 }
          ],
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          revenue_per_mission: revenuePerMission ? parseFloat(revenuePerMission) : null,
          savings_per_mission: savingsPerMission ? parseFloat(savingsPerMission) : null
        })
      }) as { roi: ROIAnalysis }

      setRoi(response.roi)
      success('ROI analysis completed!')
    } catch (err) {
      logger.error('ROI calculation error:', err)
      showError('Failed to calculate ROI')
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="card-glass p-6">
      <h2 className="text-2xl font-bold mb-4">ROI Analytics</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Revenue per Mission ($)</label>
            <input
              type="number"
              value={revenuePerMission}
              onChange={(e) => setRevenuePerMission(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Savings per Mission ($)</label>
            <input
              type="number"
              value={savingsPerMission}
              onChange={(e) => setSavingsPerMission(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
              placeholder="Optional"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition-colors"
        >
          {isCalculating ? 'Calculating...' : 'Calculate ROI'}
        </button>

        {roi && (
          <div className="mt-6 space-y-4">
            {/* ROI Summary */}
            <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">ROI Analysis</h3>
                <div className={`text-3xl font-bold ${roi.roi_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {roi.roi_percent.toFixed(1)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Cost:</span>
                  <span className="ml-2 font-semibold">${roi.total_cost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Total Revenue:</span>
                  <span className="ml-2 font-semibold">${roi.total_revenue.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Total Savings:</span>
                  <span className="ml-2 font-semibold">${roi.total_savings.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Missions:</span>
                  <span className="ml-2 font-semibold">{roi.missions_completed}</span>
                </div>
                {roi.payback_period_days && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Payback Period:</span>
                    <span className="ml-2 font-semibold">{roi.payback_period_days.toFixed(0)} days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Efficiency Metrics */}
            <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
              <h3 className="font-semibold mb-3">Efficiency Metrics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Cost per Hour:</span>
                  <span className="ml-2 font-semibold">${roi.efficiency_metrics.cost_per_hour.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Cost per Mission:</span>
                  <span className="ml-2 font-semibold">${roi.efficiency_metrics.cost_per_mission.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Missions per Day:</span>
                  <span className="ml-2 font-semibold">{roi.efficiency_metrics.missions_per_day.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Avg Flight Time:</span>
                  <span className="ml-2 font-semibold">{roi.efficiency_metrics.average_flight_time.toFixed(1)} hrs</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

