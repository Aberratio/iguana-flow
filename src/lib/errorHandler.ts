// Error handling utility for consistent error logging across the application
type ErrorContext = {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
};

/**
 * Logs an error with optional context information
 * In development: logs to console
 * In production: can be extended to send to error tracking service (e.g., Sentry)
 */
export const logError = (error: unknown, context?: ErrorContext) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  // In development - log to console
  if (import.meta.env.DEV) {
    console.error('[Error]', errorMessage, { context, stack: errorStack });
  }
  
  // In production - can be extended to send to error tracking service
  if (import.meta.env.PROD) {
    // TODO: Integrate with error tracking service (e.g., Sentry)
    // Example: Sentry.captureException(error, { extra: context });
  }
};

/**
 * Logs a warning with optional context information
 * In development: logs to console
 * In production: can be extended to log to monitoring service
 */
export const logWarning = (message: string, context?: ErrorContext) => {
  if (import.meta.env.DEV) {
    console.warn('[Warning]', message, context);
  }
  
  if (import.meta.env.PROD) {
    // TODO: Log to monitoring service
  }
};

