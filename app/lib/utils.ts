/**
 * Utility functions for the application
 */
import { logger } from './logger'

/**
 * Handle API errors with user-friendly messages
 */
export function handleApiError(error: unknown, defaultMessage: string = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message || defaultMessage
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return defaultMessage
}

/**
 * Show a toast notification (simple implementation)
 * Note: This function is deprecated - use the useToast hook instead
 * Kept for backward compatibility but should not be used in new code
 */
export function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  // Log only in development - in production, use the useToast hook from components
  logger.warn('showToast() is deprecated. Use the useToast hook instead.')
  logger.info(`[${type.toUpperCase()}] ${message}`)
  
  // Do not use alert() in production - this function should not be called
  // All components should use the useToast hook from hooks/useToast.ts
}

/**
 * Convert timestamp to ISO string format
 * Handles both Unix timestamps (numbers) and ISO strings
 */
export function formatTimestamp(timestamp: string | number | null | undefined): string {
  if (!timestamp) return 'Never'
  
  try {
    // If it's a number, treat it as Unix timestamp
    if (typeof timestamp === 'number') {
      return new Date(timestamp * 1000).toISOString()
    }
    
    // If it's a string, try to parse it
    const date = new Date(timestamp)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // Try parsing as Unix timestamp string
      const unixTimestamp = parseInt(timestamp, 10)
      if (!isNaN(unixTimestamp)) {
        return new Date(unixTimestamp * 1000).toISOString()
      }
      return 'Invalid Date'
    }
    
    return date.toISOString()
  } catch (error) {
    logger.error('Error formatting timestamp:', error)
    return 'Invalid Date'
  }
}

/**
 * Format timestamp for display (localized)
 */
export function formatTimestampForDisplay(timestamp: string | number | null | undefined): string {
  if (!timestamp) return 'Never'
  
  try {
    let date: Date
    
    // If it's a number, treat it as Unix timestamp
    if (typeof timestamp === 'number') {
      date = new Date(timestamp * 1000)
    } else {
      // Try parsing as ISO string first
      date = new Date(timestamp)
      
      // If invalid, try as Unix timestamp string
      if (isNaN(date.getTime())) {
        const unixTimestamp = parseInt(timestamp, 10)
        if (!isNaN(unixTimestamp)) {
          date = new Date(unixTimestamp * 1000)
        }
      }
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    
    return date.toLocaleString()
  } catch (error) {
    logger.error('Error formatting timestamp for display:', error)
    return 'Invalid Date'
  }
}
