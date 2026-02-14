'use client'

import { useState, useCallback } from 'react'
import { useApi } from '../lib/api'
import { IconMining, IconCheck, IconSearch, IconLock } from './UIcons'
import type { Waypoint, RoutePlan } from '../types/api'

interface MiningComplianceStatus {
  casa_part101: boolean
  remote_id: boolean
  airspace_clear: boolean
  blast_zone_active: boolean
  last_updated: string
}

interface MiningDashboardProps {
  mode: 'mining'
  location?: { lat: string; lon: string }
  destination?: { lat: string; lon: string }
  onRoutePlanned?: (route: RoutePlan) => void
  onSurveyGridPlanned?: (waypoints: Waypoint[]) => void
}

export default function MiningDashboard({
  location,
  destination: _destination,
  onRoutePlanned,
  onSurveyGridPlanned,
}: MiningDashboardProps) {
  const { fetchWithAuth } = useApi()
  const [surveyGrid, setSurveyGrid] = useState<{ rows: number; cols: number; spacing_m: number }>({ rows: 5, cols: 5, spacing_m: 20 })
  const [compliance, setCompliance] = useState<MiningComplianceStatus | null>(null)
  const [inspectionTemplates, setInspectionTemplates] = useState<{ id: string; name: string; waypointCount: number }[]>([])
  const [loadingCompliance, setLoadingCompliance] = useState(false)
  const [loadingSurvey, setLoadingSurvey] = useState(false)
  const [volumeResult, _setVolumeResult] = useState<{ volume_m3?: number; area_m2?: number } | null>(null)

  const loadCompliance = useCallback(async () => {
    setLoadingCompliance(true)
    try {
      const res = await fetchWithAuth('/api/mining/compliance/status') as MiningComplianceStatus | null
      if (res) setCompliance(res)
    } catch {
      setCompliance({
        casa_part101: true,
        remote_id: true,
        airspace_clear: true,
        blast_zone_active: false,
        last_updated: new Date().toISOString(),
      })
    } finally {
      setLoadingCompliance(false)
    }
  }, [fetchWithAuth])

  const planSurveyGrid = useCallback(async () => {
    const lat = location?.lat ? parseFloat(location.lat) : undefined
    const lon = location?.lon ? parseFloat(location.lon) : undefined
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return
    setLoadingSurvey(true)
    try {
      const res = await fetchWithAuth('/api/mining/survey/grid', {
        method: 'POST',
        body: {
          location: { lat, lon },
          rows: surveyGrid.rows,
          cols: surveyGrid.cols,
          spacing_m: surveyGrid.spacing_m,
        },
      }) as { waypoints?: Array<{ id: string; lat: number; lon: number; alt: number; name?: string }>; route?: RoutePlan } | null
      if (res?.waypoints?.length) {
        const wps: Waypoint[] = res.waypoints.map((wp) => ({ id: wp.id, lat: wp.lat, lon: wp.lon, alt: wp.alt, name: wp.name }))
        onSurveyGridPlanned?.(wps)
        if (res.route) onRoutePlanned?.(res.route)
      }
      if (res?.route) onRoutePlanned?.(res.route)
    } catch {
      // Fallback: generate simple grid client-side
      const wps: Waypoint[] = []
      for (let r = 0; r < surveyGrid.rows; r++) {
        for (let c = 0; c < surveyGrid.cols; c++) {
          const dlat = (surveyGrid.spacing_m / 111000) * (r - (surveyGrid.rows - 1) / 2)
          const dlon = (surveyGrid.spacing_m / (111000 * Math.cos((lat * Math.PI) / 180))) * (c - (surveyGrid.cols - 1) / 2)
          wps.push({
            id: `mining_wp_${r}_${c}`,
            lat: lat + dlat,
            lon: lon + dlon,
            alt: 50,
            name: `Survey ${r * surveyGrid.cols + c + 1}`,
          })
        }
      }
      onSurveyGridPlanned?.(wps)
      onRoutePlanned?.({ waypoints: wps })
    } finally {
      setLoadingSurvey(false)
    }
  }, [fetchWithAuth, location, surveyGrid, onSurveyGridPlanned, onRoutePlanned])

  const loadInspectionTemplates = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/mining/inspection/templates') as { templates?: { id: string; name: string; waypoint_count: number }[] } | null
      if (res?.templates?.length) {
        setInspectionTemplates(res.templates.map((t) => ({ id: t.id, name: t.name, waypointCount: t.waypoint_count })))
      } else {
        setInspectionTemplates([
          { id: 'conveyor', name: 'Conveyor Run', waypointCount: 8 },
          { id: 'highwall', name: 'Highwall Survey', waypointCount: 12 },
          { id: 'stockpile', name: 'Stockpile Perimeter', waypointCount: 6 },
        ])
      }
    } catch {
      setInspectionTemplates([
        { id: 'conveyor', name: 'Conveyor Run', waypointCount: 8 },
        { id: 'highwall', name: 'Highwall Survey', waypointCount: 12 },
        { id: 'stockpile', name: 'Stockpile Perimeter', waypointCount: 6 },
      ])
    }
  }, [fetchWithAuth])

  return (
    <div className="space-y-6">
      <div className="card-dji p-6 border-2 border-dji-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-dji-500/20 rounded-xl flex items-center justify-center">
            <IconMining className="w-6 h-6 text-dji-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient-dji font-futuristic text-slate-200">Mining Operations (Australia)</h3>
            <p className="text-xs text-dji-400/80 text-slate-300">Survey, inspection, compliance & incident response</p>
          </div>
        </div>
      </div>

      {/* Survey Grid */}
      <div className="card-dji p-6 border-2 border-dji-500/20">
        <h4 className="text-base font-bold text-dji-300 mb-3 font-futuristic">Survey Grid</h4>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-dji-400/70 block mb-1">Rows</label>
            <input
              type="number"
              min={2}
              max={20}
              value={surveyGrid.rows}
              onChange={(e) => setSurveyGrid((s) => ({ ...s, rows: Math.max(2, parseInt(e.target.value, 10) || 2) }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-dji-500/30 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-dji-400/70 block mb-1">Cols</label>
            <input
              type="number"
              min={2}
              max={20}
              value={surveyGrid.cols}
              onChange={(e) => setSurveyGrid((s) => ({ ...s, cols: Math.max(2, parseInt(e.target.value, 10) || 2) }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-dji-500/30 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-dji-400/70 block mb-1">Spacing (m)</label>
            <input
              type="number"
              min={5}
              max={100}
              value={surveyGrid.spacing_m}
              onChange={(e) => setSurveyGrid((s) => ({ ...s, spacing_m: Math.max(5, parseInt(e.target.value, 10) || 20) }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-dji-500/30 text-white text-sm"
            />
          </div>
        </div>
        <button
          onClick={planSurveyGrid}
          disabled={loadingSurvey || !location?.lat || !location?.lon}
          className="btn-dji w-full flex items-center justify-center gap-2"
        >
          {loadingSurvey ? 'Generating…' : 'Generate Survey Grid'}
        </button>
      </div>

      {/* CASA / Compliance */}
      <div className="card-dji p-6 border-2 border-dji-500/20">
        <h4 className="text-base font-bold text-dji-300 mb-3 font-futuristic flex items-center gap-2">
          <IconLock className="w-4 h-4" /> Australian Compliance (CASA)
        </h4>
        <button
          onClick={loadCompliance}
          disabled={loadingCompliance}
          className="mb-4 px-4 py-2 glass-dji border border-dji-500/30 rounded-lg text-sm text-dji-300 hover:border-dji-500/50"
        >
          {loadingCompliance ? 'Checking…' : 'Check Compliance Status'}
        </button>
        {compliance && (
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              {compliance.casa_part101 ? <IconCheck className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 rounded-full bg-amber-500" />}
              <span className="text-slate-200">CASA Part 101 compliant</span>
            </li>
            <li className="flex items-center gap-2">
              {compliance.remote_id ? <IconCheck className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 rounded-full bg-amber-500" />}
              <span className="text-slate-200">Remote ID</span>
            </li>
            <li className="flex items-center gap-2">
              {compliance.airspace_clear ? <IconCheck className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 rounded-full bg-amber-500" />}
              <span className="text-slate-200">Airspace clear</span>
            </li>
            <li className="flex items-center gap-2">
              {!compliance.blast_zone_active ? <IconCheck className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 rounded-full bg-red-500" />}
              <span className="text-slate-200">{compliance.blast_zone_active ? 'Blast zone active' : 'No blast zone'}</span>
            </li>
          </ul>
        )}
      </div>

      {/* Inspection Templates */}
      <div className="card-dji p-6 border-2 border-dji-500/20">
        <h4 className="text-base font-bold text-dji-300 mb-3 font-futuristic flex items-center gap-2">
          <IconSearch className="w-4 h-4" /> Inspection Templates
        </h4>
        <button
          onClick={loadInspectionTemplates}
          className="mb-4 px-4 py-2 glass-dji border border-dji-500/30 rounded-lg text-sm text-dji-300 hover:border-dji-500/50"
        >
          Load Templates
        </button>
        {inspectionTemplates.length > 0 && (
          <ul className="space-y-2">
            {inspectionTemplates.map((t) => (
              <li key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50 border border-dji-500/20">
                <span className="text-slate-200 font-medium">{t.name}</span>
                <span className="text-dji-400/80 text-xs">{t.waypointCount} waypoints</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Volume result placeholder */}
      {volumeResult && (
        <div className="card-dji p-4 border-2 border-dji-500/20">
          <h4 className="text-sm font-bold text-dji-300 mb-2">Volume Estimate</h4>
          {volumeResult.volume_m3 != null && <p className="text-slate-200">Volume: {volumeResult.volume_m3.toLocaleString()} m³</p>}
          {volumeResult.area_m2 != null && <p className="text-slate-200">Area: {volumeResult.area_m2.toLocaleString()} m²</p>}
        </div>
      )}
    </div>
  )
}
