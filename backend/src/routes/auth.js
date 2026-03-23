/**
 * Authentication API Routes
 * Handles user registration, login, and token refresh
 */

import express from 'express';
import { register, login, refreshToken } from '../services/authService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuditEvent } from '../models/AuditEvent.js';

const router = express.Router();

/**
 * POST /api/auth/register
 *
 * Register a new user
 *
 * Request body:
 * {
 *   name: string (required)
 *   email: string (required)
 *   password: string (required)
 *   role?: string (optional, defaults to 'ProjectLead')
 * }
 *
 * Response:
 * {
 *   user: { id, name, email, role, created_at }
 *   accessToken: string
 *   refreshToken: string
 * }
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Register user
  const result = await register({ name, email, password, role });

  // Create audit event
  await AuditEvent.create({
    entity_type: 'USER',
    entity_id: result.user.id,
    action: 'CREATE',
    actor_id: result.user.id,
    reason: 'User registration',
    request_id: req.id
  });

  // Return success response
  res.status(201).json({
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/auth/login
 *
 * Login a user
 *
 * Request body:
 * {
 *   email: string (required)
 *   password: string (required)
 * }
 *
 * Response:
 * {
 *   user: { id, name, email, role, created_at }
 *   accessToken: string
 *   refreshToken: string
 * }
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Login user
  const result = await login({ email, password });

  // Create audit event
  await AuditEvent.create({
    entity_type: 'USER',
    entity_id: result.user.id,
    action: 'LOGIN',
    actor_id: result.user.id,
    reason: 'User login',
    request_id: req.id
  });

  // Return success response
  res.status(200).json({
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/auth/refresh
 *
 * Refresh access token using refresh token
 *
 * Request body:
 * {
 *   refreshToken: string (required)
 * }
 *
 * Response:
 * {
 *   accessToken: string
 * }
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  // Refresh token
  const result = await refreshToken(refreshToken);

  // Return success response
  res.status(200).json({
    accessToken: result.accessToken,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/auth/me
 *
 * Get current user info (requires authentication)
 */
router.get('/me', asyncHandler(async (req, res) => {
  // User is already authenticated by middleware
  res.status(200).json({
    user: req.user,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

export { router as default, router as authRouter };
