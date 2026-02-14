'use client'

/**
 * Auth hook for the app. Uses demo auth only (Clerk removed).
 * Returns user object compatible with Navigation and other components.
 */
import { useDemoAuth } from './lib/demoAuth'

export function useSafeUser() {
  const { user, isLoaded, isSignedIn, signOut } = useDemoAuth()
  return {
    user: user ?? null,
    isLoaded,
    isSignedIn,
    signOut,
  }
}
