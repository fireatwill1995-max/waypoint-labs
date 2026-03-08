'use client'

import { useCallback } from 'react'

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: string | object
  signal?: AbortSignal
}

/** Production backend URL when frontend is deployed statically (e.g. Cloudflare Pages). */
const FALLBACK_API_BASE = 'https://civilian-drone-app.fly.dev'

/**
 * Resolve API base URL so that static deployments (e.g. waypoint-labs.pages.dev) always
 * send /api/* requests to the backend, never to the static origin (which returns 405 for POST).
 */
function getApiBaseUrl(): string {
  const fromEnv = typeof process.env.NEXT_PUBLIC_API_URL === 'string'
    ? process.env.NEXT_PUBLIC_API_URL.trim()
    : ''
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    const origin = window.location?.origin || ''
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
    if (!isLocal) return FALLBACK_API_BASE
  }
  return ''
}

// Import useSafeAuth from the proper location
import { useSafeAuth } from '../hooks/useSafeAuth'

export function useApi() {
  const auth = useSafeAuth()

  const fetchWithAuth = useCallback(async (url: string, options: FetchOptions = {}): Promise<unknown> => {
    try {
      const token = await auth.getToken()
      const base = getApiBaseUrl()
      const fullUrl = url.startsWith('http')
        ? url
        : base && url.startsWith('/')
          ? base + url
          : url.startsWith('/')
            ? url
            : `/${url}`
      
      const incomingHeaders: Record<string, string> = {}
      if (options.headers) {
        const h = options.headers
        if (h instanceof Headers) {
          h.forEach((v, k) => { incomingHeaders[k] = v })
        } else if (Array.isArray(h)) {
          h.forEach(([k, v]) => { incomingHeaders[k] = v })
        } else {
          Object.assign(incomingHeaders, h)
        }
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...incomingHeaders,
      }
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      // Prepare body
      let body: string | undefined
      if (options.body) {
        body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
      }
      
      // Make request
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        body,
        signal: options.signal, // Pass abort signal for request cancellation
      })
      
      // Handle errors
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
        }
        
        // Check for specific error types
        if (response.status === 401) {
          throw new Error('Unauthorized. Please sign in again.')
        }
        
        if (response.status === 404) {
          const notFoundError: Error & { isOfflineError?: boolean } = new Error(errorMessage)
          notFoundError.isOfflineError = true
          throw notFoundError
        }
        
        throw new Error(errorMessage)
      }
      
      // Parse response
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return await response.text()
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Backend server is not running. Please start the server.') as Error & { isOfflineError?: boolean }
        networkError.isOfflineError = true
        throw networkError
      }
      
      // Re-throw other errors
      throw error
    }
  }, [auth])

  return { fetchWithAuth }
}
