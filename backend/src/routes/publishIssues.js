/**
 * Publish Issues API Route
 * POST /api/publish-issues - Publishes approved issues to Jira
 */

import express from 'express';
import { publishIssues } from '../services/jiraPublisher.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/publish-issues
 *
 * Request body:
 * {
 *   issues: Array<{
 *     id: string
 *     key: string
 *     type: 'epic' | 'story'
 *     summary: string
 *     description: string
 *     size: 'S' | 'M' | 'L' | 'XL'
 *     acceptanceCriteria: string[]
 *   }> (required)
 *   options?: {
 *     forceError?: boolean - Force an error for testing
 *     dryRun?: boolean - Simulate publishing without actually creating issues
 *   }
 * }
 *
 * Response:
 * {
 *   publishedCount: number
 *   issues: Array - Published issues with Jira IDs
 *   projectKey: string
 *   projectName: string
 *   dryRun?: boolean - If this was a dry run
 * }
 */
router.post('/', asyncHandler(async (req, res) => {
  const { issues, options = {} } = req.body;

  // Validate that issues are provided
  if (!issues) {
    return res.status(400).json({
      error: 'Missing required field: issues',
      code: 'VALIDATION_ERR',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }

  // Pass request ID to services for logging
  const requestOptions = {
    ...options,
    requestId: req.id
  };

  // Publish issues
  const result = await publishIssues(issues, requestOptions);

  // Return success response
  res.status(200).json({
    publishedCount: result.publishedCount,
    issues: result.issues,
    projectKey: result.projectKey,
    projectName: result.projectName || `Project ${result.projectKey}`,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    ...(result.dryRun && { dryRun: true })
  });
}));

/**
 * GET /api/publish-issues/project-info
 * Get information about the configured Jira project
 */
router.get('/project-info', (req, res) => {
  import('../services/jiraPublisher.js').then(({ getProjectInfo }) => {
    res.json({
      ...getProjectInfo(),
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  });
});

/**
 * GET /api/publish-issues/health
 * Health check for the publish service
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'jira-publisher',
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

export { router as default, router as publishIssuesRouter };
