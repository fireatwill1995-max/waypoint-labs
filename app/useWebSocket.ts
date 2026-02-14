'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { logger } from './lib/logger'

export interface WebSocketOptions {
  url: string
  onMessage?: (data: unknown) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(options: WebSocketOptions) {
  const {
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Store callbacks in refs to avoid recreating connect on every render
  const callbacksRef = useRef({ onMessage, onOpen, onClose, onError })
  useEffect(() => {
    callbacksRef.current = { onMessage, onOpen, onClose, onError }
  }, [onMessage, onOpen, onClose, onError])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    // Don't attempt to connect if URL is invalid
    if (!url || typeof url !== 'string') {
      return
    }
    
    // Validate WebSocket URL to prevent SSRF
    const trimmedUrl = url.trim()
    if (!trimmedUrl.startsWith('ws://') && !trimmedUrl.startsWith('wss://')) {
      return
    }
    
    // Additional security: prevent protocol-relative URLs and localhost bypasses
    if (trimmedUrl.startsWith('ws:////') || trimmedUrl.startsWith('wss:////')) {
      return
    }
    
    // In production, restrict to secure WebSocket (wss://) only
    if (process.env.NODE_ENV === 'production' && trimmedUrl.startsWith('ws://')) {
      setError('Insecure WebSocket connection (ws://) not allowed in production')
      return
    }

    // Don't attempt to connect if we've exceeded max attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      return
    }

    try {
      const ws = new WebSocket(trimmedUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        callbacksRef.current.onOpen?.()
      }

      ws.onmessage = (event) => {
        try {
          if (!event.data || typeof event.data !== 'string') {
            logger.warn('Invalid WebSocket message data type')
            return
          }
          const data = JSON.parse(event.data)
          callbacksRef.current.onMessage?.(data)
        } catch (err) {
          // Log parsing errors using logger
          if (err instanceof SyntaxError) {
            logger.error('Failed to parse WebSocket message (invalid JSON):', err)
          } else {
            logger.error('Failed to parse WebSocket message:', err)
          }
        }
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        callbacksRef.current.onClose?.()

        // Only attempt to reconnect if it wasn't a clean close and we haven't exceeded max attempts
        if (!event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1
          // Exponential backoff: increase delay with each attempt
          const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1)
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, Math.min(delay, 30000)) // Cap at 30 seconds
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached')
        }
      }

      ws.onerror = (event) => {
        // Only log error if we haven't exceeded max attempts (to reduce console spam)
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          setError('WebSocket error occurred')
        }
        callbacksRef.current.onError?.(event)
      }
    } catch (err) {
      // Silently handle connection errors to reduce console spam
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        setError(`Failed to connect: ${err}`)
      }
    }
  }, [url, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    // Reset reconnection attempts counter
    reconnectAttemptsRef.current = 0
    // Close WebSocket connection
    if (wsRef.current) {
      try {
        // Only close if not already closed
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close()
        }
      } catch (e) {
        // Ignore errors during cleanup
        logger.warn('Error closing WebSocket during cleanup:', e)
      }
      wsRef.current = null
    }
    setIsConnected(false)
    setError(null)
  }, [])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const serialized = JSON.stringify(data)
        wsRef.current.send(serialized)
        return true
      } catch (err) {
        logger.error('Failed to serialize WebSocket message:', err)
        return false
      }
    }
    return false
  }, [])

  useEffect(() => {
    // Only attempt connection if URL is valid and not disabled
    if (url && url.startsWith('ws://') && !url.includes('disabled')) {
      connect()
      return () => {
        disconnect()
      }
    } else if (url && url.startsWith('wss://')) {
      connect()
      return () => {
        disconnect()
      }
    }
    // Return cleanup function even when not connecting
    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, connect, disconnect]) // Include connect and disconnect in dependencies

  return {
    isConnected,
    error,
    send,
    disconnect,
    reconnect: connect,
  }
}
