/**
 * Generate Issues API Route
 * POST /api/generate-issues - Accepts specification text and returns AI-generated issues
 */

import express from 'express';
import { generateIssues } from '../services/issueGenerator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/generate-issues
 *
 * Request body:
 * {
 *   specText: string (required) - The specification text to process
 *   options?: {
 *     forceError?: boolean - Force an error for testing
 *   }
 * }
 *
 * Response:
 * {
 *   issues: Array<{
 *     id: string
 *     key: string
 *     type: 'epic' | 'story'
 *     summary: string
 *     description: string
 *     size: 'S' | 'M' | 'L' | 'XL'
 *     acceptanceCriteria: string[]
 *     status: 'DRAFT' | 'PUBLISHED'
 *   }>
 *   analysis?: object - Analysis of the specification (optional)
 * }
 */
router.post('/', asyncHandler(async (req, res) => {
  const { specText, options = {} } = req.body;

  // Pass request ID to services for logging
  const requestOptions = {
    ...options,
    requestId: req.id
  };

  // Generate issues
  const result = await generateIssues(specText, requestOptions);

  // Return success response (usedAI lets clients distinguish real AI vs mock)
  res.status(200).json({
    issues: result.issues,
    usedAI: result.usedAI,
    analysis: result.analysis,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/generate-issues/health
 * Health check for the issue generation service
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'issue-generator',
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

export { router as default, router as generateIssuesRouter };
