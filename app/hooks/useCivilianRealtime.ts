'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWebSocket } from '../useWebSocket'
import { logger } from '../lib/logger'
import type { DroneInstance, Detection, RoutePlan, Waypoint } from '../types/api'

export interface CivilianRealtimeData {
  drones: DroneInstance[]
  detections: Detection[]
  routePlan: RoutePlan | null
  waypoints: Waypoint[]
  aiAdvice: string
  telemetry: Record<string, unknown>
}

export function useCivilianRealtime(initialData?: Partial<CivilianRealtimeData>) {
  const [data, setData] = useState<CivilianRealtimeData>({
    drones: initialData?.drones || [],
    detections: initialData?.detections || [],
    routePlan: initialData?.routePlan || null,
    waypoints: initialData?.waypoints || [],
    aiAdvice: initialData?.aiAdvice || '',
    telemetry: initialData?.telemetry || {},
  })

  const WS_BASE_URL = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_WS_URL || '')
    : ''
  
  // Only enable WebSocket if URL is properly configured (don't default to localhost to prevent spam)
  const shouldConnect = WS_BASE_URL && WS_BASE_URL !== 'ws://' && WS_BASE_URL !== '' && WS_BASE_URL.startsWith('ws')
  
  const { isConnected, send } = useWebSocket({
    url: shouldConnect ? `${WS_BASE_URL}/ws` : 'ws://disabled', // Use invalid URL if disabled to prevent connection
    onMessage: (message) => {
      try {
        // Handle different message types
        if (typeof message !== 'object' || message === null) {
          return
        }
        const msg = message as { type?: string; payload?: unknown }
        if (msg.type === 'telemetry') {
          const telemetryPayload = msg.payload as Record<string, unknown> | undefined
          setData((prev) => ({
            ...prev,
            telemetry: { ...prev.telemetry, ...telemetryPayload },
          }))
        } else if (msg.type === 'detection_update') {
          const payload = msg.payload as { detections?: Detection[] } | undefined
          setData((prev) => ({
            ...prev,
            detections: payload?.detections || prev.detections,
          }))
        } else if (msg.type === 'drone_update') {
          const payload = msg.payload as { drones?: DroneInstance[] } | undefined
          setData((prev) => ({
            ...prev,
            drones: payload?.drones || prev.drones,
          }))
        } else if (msg.type === 'route_update') {
          const payload = msg.payload as { routePlan?: RoutePlan | null; waypoints?: Waypoint[] } | undefined
          setData((prev) => ({
            ...prev,
            routePlan: payload?.routePlan ?? prev.routePlan,
            waypoints: payload?.waypoints || prev.waypoints,
          }))
        } else if (msg.type === 'ai_advice') {
          const payload = msg.payload as { advice?: string } | undefined
          setData((prev) => ({
            ...prev,
            aiAdvice: payload?.advice || prev.aiAdvice,
          }))
        } else if (msg.type === 'status_update') {
          // Handle general status updates
          const payload = msg.payload as { drones?: DroneInstance[] } | undefined
          if (payload?.drones) {
            setData((prev) => ({
              ...prev,
              drones: payload.drones || prev.drones,
            }))
          }
        }
      } catch (error) {
        logger.error('Error processing WebSocket message:', error)
      }
    },
    reconnectInterval: 3000,
    maxReconnectAttempts: shouldConnect ? 5 : 0, // Don't retry if WebSocket is disabled
  })

  // Request initial data on connection
  useEffect(() => {
    if (isConnected) {
      send({ type: 'subscribe', channels: ['telemetry', 'detections', 'drones', 'routes', 'ai_advice'] })
    }
  }, [isConnected, send])

  const updateDrones = useCallback((drones: DroneInstance[]) => {
    setData((prev) => ({ ...prev, drones }))
  }, [])

  const updateDetections = useCallback((detections: Detection[]) => {
    setData((prev) => ({ ...prev, detections }))
  }, [])

  const updateRoutePlan = useCallback((routePlan: RoutePlan | null) => {
    setData((prev) => ({ ...prev, routePlan }))
  }, [])

  const updateWaypoints = useCallback((waypoints: Waypoint[]) => {
    setData((prev) => ({ ...prev, waypoints }))
  }, [])

  const updateAiAdvice = useCallback((advice: string) => {
    setData((prev) => ({ ...prev, aiAdvice: advice }))
  }, [])

  return {
    data,
    isConnected,
    updateDrones,
    updateDetections,
    updateRoutePlan,
    updateWaypoints,
    updateAiAdvice,
    send,
  }
}
