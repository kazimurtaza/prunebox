/**
 * Client-side logger utility for Prunebox
 * Provides structured error logging for browser environment
 */

export interface ClientErrorContext {
  [key: string]: string | number | boolean | null | undefined | ClientErrorContext | unknown[];
}

/**
 * Format error for consistent client-side logging
 * @param message - Error message
 * @param error - Optional error object or unknown value
 * @param context - Optional additional context
 */
export function clientError(
  message: string,
  error?: Error | unknown,
  context?: ClientErrorContext
): void {
  const timestamp = new Date().toISOString();

  let errorDetails: Record<string, unknown> = { timestamp };

  if (error instanceof Error) {
    errorDetails.error = error.message;
    if (error.stack) {
      errorDetails.stack = error.stack;
    }
  } else if (error !== undefined) {
    errorDetails.error = String(error);
  }

  if (context) {
    errorDetails = { ...errorDetails, ...context };
  }

  const formattedMessage = `[${timestamp}] [ERROR] ${message}`;

  // Log with expanded details in browser console
  console.error(formattedMessage, errorDetails);
}

/**
 * Format warning for consistent client-side logging
 * @param message - Warning message
 * @param context - Optional additional context
 */
export function clientWarn(message: string, context?: ClientErrorContext): void {
  const timestamp = new Date().toISOString();

  if (context) {
    console.warn(`[${timestamp}] [WARN] ${message}`, context);
  } else {
    console.warn(`[${timestamp}] [WARN] ${message}`);
  }
}

/**
 * Format info for consistent client-side logging
 * @param message - Info message
 * @param context - Optional additional context
 */
export function clientInfo(_message: string, _context?: ClientErrorContext): void {
  // Info logging disabled - use clientWarn or clientError for important messages
}
