/**
 * Authentication Middleware
 * Validates JWT tokens and adds user info to request
 */

import { verifyToken } from '../services/authService.js';
import { ApiError, ErrorCodes } from './errorHandler.js';

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
export function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Missing or invalid Authorization header', ErrorCodes.UNAUTHORIZED, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Add user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Doesn't fail if no token is provided, but adds user info if token is valid
 */
export function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      };
    }
    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
}

/**
 * Role-based authorization middleware factory
 * Returns middleware that checks if user has required role
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('Authentication required', ErrorCodes.UNAUTHORIZED, 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(
        'Insufficient permissions',
        ErrorCodes.FORBIDDEN,
        403
      ));
    }

    next();
  };
}

/**
 * Require ProjectLead role
 */
export const requireProjectLead = authorize('ProjectLead');

/**
 * Require Developer or ProjectLead role
 */
export const requireDeveloperOrLead = authorize('ProjectLead', 'Developer');

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireProjectLead,
  requireDeveloperOrLead
};
