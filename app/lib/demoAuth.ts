'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from './logger'

export interface DemoUser {
  id: string
  email: string
  name: string
  role: string
}

const DEMO_USER_KEY = 'demo_user'
const DEMO_SESSION_KEY = 'demo_session'

// Admin-only: required for admin account sign-in (not exposed in DEMO_USERS display)
export const ADMIN_CREDENTIALS = {
  email: 'admin@waypointlabs.com',
  password: 'WlAdmin2024!',
} as const

// Demo users: civilian (shown on login) + admin (sign in with email/password only)
export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-1',
    email: 'demo@waypointlabs.io',
    name: 'Demo User',
    role: 'civilian',
  },
  {
    id: 'demo-2',
    email: ADMIN_CREDENTIALS.email,
    name: 'Admin',
    role: 'admin',
  },
]

export function useDemoAuth() {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    // Load demo user from localStorage
    try {
      const stored = localStorage.getItem(DEMO_USER_KEY)
      const session = localStorage.getItem(DEMO_SESSION_KEY)
      
      if (stored && session) {
        // Validate stored data before parsing
        if (!stored.trim() || !session.trim()) {
          return
        }
        
        const parsed = JSON.parse(stored) as unknown
        // Validate parsed user structure
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'id' in parsed &&
          'email' in parsed &&
          'name' in parsed &&
          typeof (parsed as DemoUser).id === 'string' &&
          typeof (parsed as DemoUser).email === 'string' &&
          typeof (parsed as DemoUser).name === 'string'
        ) {
          const user = parsed as DemoUser
          
          // Verify session is still valid (24 hours)
          const sessionData = JSON.parse(session) as { timestamp?: number; userId?: string }
          if (
            sessionData.timestamp &&
            typeof sessionData.timestamp === 'number' &&
            Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000 &&
            sessionData.userId === user.id
          ) {
            setUser(user)
          } else {
            // Session expired or invalid
            localStorage.removeItem(DEMO_USER_KEY)
            localStorage.removeItem(DEMO_SESSION_KEY)
          }
        } else {
          // Invalid user data - clear it
          localStorage.removeItem(DEMO_USER_KEY)
          localStorage.removeItem(DEMO_SESSION_KEY)
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Error loading demo user:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signIn = useCallback((email: string, _password?: string) => {
    // Only work on client side
    if (typeof window === 'undefined') {
      return { success: false, error: 'Cannot sign in on server' }
    }

    // Sanitize email input
    const sanitizedEmail = String(email || '').trim().toLowerCase().slice(0, 255)
    if (!sanitizedEmail) {
      return { success: false, error: 'Invalid email' }
    }
    
    // Find user by email
    const foundUser = DEMO_USERS.find(u => u.email.toLowerCase() === sanitizedEmail)

    // Admin account requires password
    if (foundUser?.role === 'admin') {
      const password = String(_password ?? '').trim()
      if (password !== ADMIN_CREDENTIALS.password) {
        return { success: false, error: 'Invalid admin password' }
      }
    }

    if (foundUser) {
      setUser(foundUser)
      try {
        // Validate user data before storing
        const userToStore: DemoUser = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name.slice(0, 100), // Limit name length
          role: foundUser.role,
        }
        
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(userToStore))
        localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({
          timestamp: Date.now(),
          userId: foundUser.id,
        }))
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Error saving to localStorage:', error)
        }
        return { success: false, error: 'Failed to save session' }
      }
      return { success: true, user: foundUser }
    }
    
    return { success: false, error: 'User not found' }
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(DEMO_USER_KEY)
        localStorage.removeItem(DEMO_SESSION_KEY)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Error clearing localStorage:', error)
        }
      }
    }
  }, [])

  const getToken = useCallback(async () => {
    // Return a demo token for API calls
    if (user) {
      return `demo_token_${user.id}_${Date.now()}`
    }
    return null
  }, [user])

  return {
    user,
    isLoaded: !isLoading,
    isSignedIn: !!user,
    signIn,
    signOut,
    getToken,
  }
}
