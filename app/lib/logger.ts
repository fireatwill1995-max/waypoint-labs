/**
 * Centralized logging utility for the frontend
 * Replaces console.log/error/warn with a proper logging system
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    // In development, log to console
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.log
      if (data !== undefined) {
        consoleMethod(`[${level.toUpperCase()}] ${message}`, data)
      } else {
        consoleMethod(`[${level.toUpperCase()}] ${message}`)
      }
    }

    // In production, you could send logs to a logging service
    // Example: sendToLoggingService({ level, message, data, timestamp: Date.now() })
  }

  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      this.log('debug', message, data)
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    // Suppress warnings for expected offline/backend errors
    if (typeof message === 'string' && message.includes('Could not fetch drones')) {
      let error: unknown = data
      if (data && typeof data === 'object' && 'error' in data) {
        error = (data as { error?: unknown }).error || data
      }
      if (error instanceof Error) {
        const errorMsg = error.message || String(error)
        if (errorMsg.includes('Not Found') || errorMsg.includes('404') || 
            errorMsg.includes('Backend server is not running') ||
            errorMsg.includes('Failed to fetch') || errorMsg.includes('Network error')) {
          // Suppress expected offline errors
          return
        }
      }
    }
    this.log('warn', message, data)
  }

  error(message: string, data?: unknown): void {
    // Suppress errors for expected offline/backend errors
    if (typeof message === 'string') {
      let error: unknown = data
      if (data && typeof data === 'object' && 'error' in data) {
        error = (data as { error?: unknown }).error || data
      }
      if (error instanceof Error) {
        const errorMsg = error.message || String(error)
        if (errorMsg.includes('Backend server is not running') ||
            errorMsg.includes('Failed to fetch') || 
            errorMsg.includes('Network error') ||
            (errorMsg.includes('Not Found') && errorMsg.includes('api'))) {
          // Suppress expected offline errors
          return
        }
      }
      // Also check the message itself
      if (message.includes('Backend server is not running') ||
          (message.includes('Failed to connect to API') && typeof data === 'object' && data !== null)) {
        const errorData = data as { message?: string }
        if (errorData?.message?.includes('Backend server is not running') ||
            errorData?.message?.includes('Failed to fetch')) {
          return
        }
      }
    }
    this.log('error', message, data)
  }
}

// Export singleton instance
export const logger = new Logger()
