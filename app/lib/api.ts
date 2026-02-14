'use client'

import { useCallback } from 'react'

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: string | object
  signal?: AbortSignal
}

// Import useSafeAuth from the proper location
import { useSafeAuth } from '../useSafeAuth'

export function useApi() {
  const auth = useSafeAuth()

  const fetchWithAuth = useCallback(async (url: string, options: FetchOptions = {}): Promise<unknown> => {
    try {
      const token = await auth.getToken()
      
      // Use relative path to leverage Next.js rewrite rules (avoids CORS when same-origin)
      // When NEXT_PUBLIC_API_URL is set (e.g. static export / Cloudflare), requests go directly to backend
      const base = typeof process.env.NEXT_PUBLIC_API_URL === 'string' ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') : ''
      const fullUrl = url.startsWith('http')
        ? url
        : base && url.startsWith('/')
          ? base + url
          : url.startsWith('/')
            ? url
            : `/${url}`
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
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
          const isOfflineError = new Error(errorMessage) as Error & { isOfflineError?: boolean }
          isOfflineError.isOfflineError = true
          throw isOfflineError
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
