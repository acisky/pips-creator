/**
 * Logger utility for conditional logging based on environment
 * Replaces direct console.log usage throughout the application
 */

type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug'

interface LogMetadata {
  [key: string]: any
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
  }

  /**
   * Log general information (only in development)
   */
  log(message: string, metadata?: LogMetadata): void {
    if (this.isDevelopment) {
      if (metadata) {
        console.log(`[LOG] ${message}`, metadata)
      } else {
        console.log(`[LOG] ${message}`)
      }
    }
  }

  /**
   * Log errors (always logged, even in production)
   * In production, consider sending to error tracking service like Sentry
   */
  error(message: string, error?: Error | any, metadata?: LogMetadata): void {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, {
        error: error.message,
        stack: error.stack,
        ...metadata
      })
    } else if (error) {
      console.error(`[ERROR] ${message}`, error, metadata)
    } else {
      console.error(`[ERROR] ${message}`, metadata)
    }

    // TODO: In production, send to error tracking service
    // if (!this.isDevelopment) {
    //   sendToSentry(message, error, metadata)
    // }
  }

  /**
   * Log warnings (only in development)
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (this.isDevelopment) {
      if (metadata) {
        console.warn(`[WARN] ${message}`, metadata)
      } else {
        console.warn(`[WARN] ${message}`)
      }
    }
  }

  /**
   * Log informational messages (only in development)
   */
  info(message: string, metadata?: LogMetadata): void {
    if (this.isDevelopment) {
      if (metadata) {
        console.info(`[INFO] ${message}`, metadata)
      } else {
        console.info(`[INFO] ${message}`)
      }
    }
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.isDevelopment) {
      if (metadata) {
        console.debug(`[DEBUG] ${message}`, metadata)
      } else {
        console.debug(`[DEBUG] ${message}`)
      }
    }
  }

  /**
   * Create a child logger with a specific context
   */
  child(context: string) {
    return {
      log: (message: string, metadata?: LogMetadata) =>
        this.log(`[${context}] ${message}`, metadata),
      error: (message: string, error?: Error | any, metadata?: LogMetadata) =>
        this.error(`[${context}] ${message}`, error, metadata),
      warn: (message: string, metadata?: LogMetadata) =>
        this.warn(`[${context}] ${message}`, metadata),
      info: (message: string, metadata?: LogMetadata) =>
        this.info(`[${context}] ${message}`, metadata),
      debug: (message: string, metadata?: LogMetadata) =>
        this.debug(`[${context}] ${message}`, metadata),
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export default for convenient import
export default logger
