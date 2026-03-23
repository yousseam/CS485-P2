/**
 * Authentication Service
 * Handles user authentication and JWT token management
 */

import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError, ErrorCodes } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '1h';
const JWT_REFRESH_EXPIRES_IN = '7d';

/**
 * Generate JWT access token
 */
export function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new ApiError('Invalid or expired token', ErrorCodes.UNAUTHORIZED, 401);
  }
}

/**
 * Register a new user
 */
export async function register({ name, email, password, role = 'ProjectLead' }) {
  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ApiError('User with this email already exists', ErrorCodes.USER_EXISTS, 409);
  }

  // Create user
  const user = await User.create({ name, email, password, role });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken
  };
}

/**
 * Login a user
 */
export async function login({ email, password }) {
  // Find user
  const user = await User.findByEmail(email);
  if (!user) {
    throw new ApiError('Invalid email or password', ErrorCodes.INVALID_CREDENTIALS, 401);
  }

  // Verify password
  const isValid = await user.verifyPassword(password);
  if (!isValid) {
    throw new ApiError('Invalid email or password', ErrorCodes.INVALID_CREDENTIALS, 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken
  };
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshTokenStr) {
  try {
    const decoded = jwt.verify(refreshTokenStr, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      throw new ApiError('Invalid refresh token', ErrorCodes.UNAUTHORIZED, 401);
    }

    // Find user
    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new ApiError('User not found', ErrorCodes.USER_NOT_FOUND, 404);
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return {
      accessToken
    };
  } catch (error) {
    throw new ApiError('Invalid refresh token', ErrorCodes.UNAUTHORIZED, 401);
  }
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  register,
  login,
  refreshToken
};
