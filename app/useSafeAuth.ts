'use client'

/**
 * Auth hook for API token. Uses demo auth only (Clerk removed).
 * useApi() uses getToken() for Authorization header.
 */
import { useDemoAuth } from './lib/demoAuth'

export function useSafeAuth() {
  const { getToken, isSignedIn, isLoaded } = useDemoAuth()
  return {
    getToken: async (): Promise<string | null> => {
      const t = await getToken()
      return t ?? null
    },
    isLoaded,
    isSignedIn,
    userId: null as string | null,
    sessionId: null as string | null,
  }
}
