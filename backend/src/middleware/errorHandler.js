/**
 * Global error handler middleware
 * Provides consistent error responses across all endpoints
 */

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error codes for different types of errors
 */
export const ErrorCodes = {
  // Generation errors
  AI_PROC_ERR_429: 'AI_PROC_ERR_429',
  AI_PROC_ERR_500: 'AI_PROC_ERR_500',
  INVALID_SPEC: 'INVALID_SPEC',

  // Publish errors
  PUBLISH_ERR: 'PUBLISH_ERR',
  INVALID_ISSUES: 'INVALID_ISSUES',
  JIRA_API_ERR: 'JIRA_API_ERR',

  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_EXISTS: 'USER_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',

  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  VERSION_CONFLICT: 'VERSION_CONFLICT',

  // General errors
  VALIDATION_ERR: 'VALIDATION_ERR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERR: 'INTERNAL_ERR'
};

/**
 * Generate request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Error handler middleware
 */
export function errorHandler(err, req, res, next) {
  // Determine if this is our custom ApiError or a generic error
  const isApiError = err instanceof ApiError;
  const code = err.code || ErrorCodes.INTERNAL_ERR;
  const statusCode = err.statusCode || 500;
  const message = isApiError ? err.message : 'An unexpected error occurred';

  // Log the error
  console.error(`[${new Date().toISOString()}] Error:`, {
    code,
    message: err.message,
    stack: err.stack,
    requestId: req.id,
    path: req.path,
    method: req.method
  });

  // Send error response
  res.status(statusCode).json({
    error: message,
    code,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
    requestId: req.id || generateRequestId()
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export { generateRequestId };
