/**
 * Request logging middleware
 * Logs incoming requests with request IDs for tracing
 */

import { generateRequestId } from './errorHandler.js';

/**
 * Generate and attach request ID, then log the request
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Generate or use existing request ID
  req.id = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', req.id);

  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    requestId: req.id,
    query: req.query,
    contentType: req.get('content-type'),
    userAgent: req.get('user-agent')
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode}`, {
      requestId: req.id,
      duration: `${duration}ms`
    });
  });

  next();
}
