'use client'

import { useEffect, useState } from 'react'
import { useWebSocket } from './useWebSocket'
import type { ApiStatus } from './types/api'

export function useRealtimeStatus(initialStatus: ApiStatus | null) {
  const [status, setStatus] = useState<ApiStatus | null>(initialStatus)

  // Only use WebSocket if URL is properly configured
  const WS_BASE_URL = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_WS_URL || '')
    : ''
  
  // Only enable WebSocket if URL is properly configured
  const shouldConnect = WS_BASE_URL && WS_BASE_URL !== '' && WS_BASE_URL.startsWith('ws')
  
  const { isConnected } = useWebSocket({
    url: shouldConnect ? `${WS_BASE_URL}/ws` : 'ws://disabled',
    onMessage: (data) => {
      if (typeof data === 'object' && data !== null && 'type' in data) {
        const msg = data as { type: string; payload?: unknown }
        if (msg.type === 'status_update' && msg.payload) {
          setStatus(msg.payload as ApiStatus)
        }
      }
    },
    reconnectInterval: 5000,
    maxReconnectAttempts: shouldConnect ? 10 : 0, // Don't retry if WebSocket is disabled
  })

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus)
    }
  }, [initialStatus])

  return { status, isConnected }
}
