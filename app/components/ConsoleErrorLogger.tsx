'use client'

import { useEffect } from 'react'

/**
 * In development: capture and log all console errors and unhandled rejections
 * so they can be reviewed and fixed. Does nothing in production.
 */
export default function ConsoleErrorLogger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const logError = (type: string, message: string, stack?: string) => {
      console.warn(`[ConsoleErrorLogger] ${type}:`, message, stack ?? '')
    }

    const onError = (event: ErrorEvent) => {
      logError(
        'window.onerror',
        event.message ?? String(event),
        event.error?.stack
      )
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason instanceof Error
        ? event.reason.message
        : String(event.reason)
      const stack = event.reason instanceof Error ? event.reason.stack : undefined
      logError('unhandledrejection', message, stack)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
