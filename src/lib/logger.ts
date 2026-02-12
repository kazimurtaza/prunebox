import pino from 'pino';

/**
 * Logger configuration
 *
 * Uses Pino for fast, structured logging
 * In development: pretty prints with colors
 * In production: JSON output for log aggregation
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  // In development, use pretty print for readability
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss Z',
        },
      }
    : undefined,
  // Redact sensitive data
  redact: {
    paths: ['accessToken', 'refreshToken', 'password', 'token'],
    remove: true,
  },
  // Add context to all logs
  base: {
    env: process.env.NODE_ENV || 'development',
  },
});

/**
 * Create a child logger with additional context
 *
 * @param context - Additional context to include in all log entries
 * @returns Child logger with bound context
 *
 * @example
 * const log = logger.child({ userId: '123', module: 'scan-worker' });
 * log.info('Starting scan');
 */
export function createLogger(context: Record<string, unknown> = {}) {
  return logger.child(context);
}

/**
 * Log levels for type safety
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Logging interface with child logger support
 */
export interface Logger {
  trace: (msg: string, ...args: any[]) => void;
  debug: (msg: string, ...args: any[]) => void;
  info: (msg: string, ...args: any[]) => void;
  warn: (msg: string, ...args: any[]) => void;
  error: (msg: string, ...args: any[]) => void;
  fatal: (msg: string, ...args: any[]) => void;

  child: (bindings: Record<string, any>) => Logger;
}

export type { Logger as PinoLogger };
