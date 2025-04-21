/**
 * Logger utility for consistent formatting of log messages across the app
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
type LogTag = 'AUTH' | 'ONBOARDING' | 'UPLOAD' | 'OCR' | 'SUPABASE' | 'ERROR' | 'SCAN-HISTORY' | 'DETAILS';

/**
 * Log a message with a specific tag and optional data
 */
export function log(tag: LogTag, message: string, data?: any): void {
  const formattedMessage = `[${tag}] ${message}`;
  if (data) {
    console.log(formattedMessage, data);
  } else {
    console.log(formattedMessage);
  }
}

/**
 * Log an error with a specific tag, message, and optional error object
 */
export function error(tag: LogTag, message: string, err?: any): void {
  const formattedMessage = `[${tag}] ${message}`;
  if (err) {
    if (err instanceof Error) {
      console.error(formattedMessage, { 
        errorMessage: err.message, 
        stack: err.stack,
        ...err 
      });
    } else {
      console.error(formattedMessage, err);
    }
  } else {
    console.error(formattedMessage);
  }
}

/**
 * Log a warning with a specific tag and optional data
 */
export function warn(tag: LogTag, message: string, data?: any): void {
  const formattedMessage = `[${tag}] ${message}`;
  if (data) {
    console.warn(formattedMessage, data);
  } else {
    console.warn(formattedMessage);
  }
}

/**
 * Log info with a specific tag and optional data
 */
export function info(tag: LogTag, message: string, data?: any): void {
  const formattedMessage = `[${tag}] ${message}`;
  if (data) {
    console.info(formattedMessage, data);
  } else {
    console.info(formattedMessage);
  }
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Log an API request with relevant details
 */
export function logApiRequest(tag: LogTag, method: string, path: string, params?: any): void {
  log(tag, `API ${method} ${path}`, params);
}

/**
 * Log database operation details
 */
export function logDbOperation(operation: 'insert' | 'update' | 'select' | 'delete', table: string, details?: any): void {
  log('SUPABASE', `${operation.toUpperCase()} on ${table}`, details);
}

export default {
  log,
  error,
  warn,
  info,
  truncateText,
  logApiRequest,
  logDbOperation
}; 