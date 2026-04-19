/**
 * Tasks API Routes
 * Handles task review, edit, approve, reject, and publish
 * Critical for US2 (review/edit before publishing)
 */

import express from 'express';
import { SuggestionBatch } from '../models/SuggestionBatch.js';
import { GeneratedTask } from '../models/GeneratedTask.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { ApiError, ErrorCodes } from '../middleware/errorHandler.js';
import { publishIssues } from '../services/jiraPublisher.js';

const router = express.Router();

/**
 * GET /api/batches/:batchId/tasks
 *
 * Get all tasks in a batch (US2 - review workflow)
 */
router.get('/batches/:batchId', authenticate, asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  const batch = await SuggestionBatch.findById(batchId);

  if (!batch) {
    return res.status(404).json({
      error: 'Batch not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  const tasks = await batch.getTasks();

  // Return success response
  res.status(200).json({
    batch: batch.toJSON(),
    tasks,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/tasks/:taskId
 *
 * Get a specific task
 */
router.get('/:taskId', authenticate, asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await GeneratedTask.findById(taskId);

  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Return success response
  res.status(200).json({
    task: task.toJSON(),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * PATCH /api/tasks/:taskId
 *
 * Edit a task (US2 - review/edit workflow)
 * Uses optimistic locking with version field
 *
 * Request body:
 * {
 *   version: number (required) - Current version for optimistic locking
 *   title?: string
 *   description?: string
 *   acceptance_criteria?: string[]
 *   task_type?: 'epic' | 'story'
 *   size?: 'S' | 'M' | 'L' | 'XL'
 *   suggested_priority?: string
 *   suggested_story_points?: number
 *   tags?: string[]
 * }
 */
router.patch('/:taskId', authenticate, asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { version, ...updates } = req.body;

  // Validate version is provided
  if (!version) {
    throw new ApiError(
      'Version field is required for updates (optimistic locking)',
      ErrorCodes.INVALID_INPUT,
      400
    );
  }

  const task = await GeneratedTask.findById(taskId);

  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Update task with optimistic locking
  const updatedTask = await task.update(updates, version);

  // Create audit event
  await AuditEvent.create({
    entity_type: 'TASK',
    entity_id: task.id,
    action: 'UPDATE',
    actor_id: req.user.id,
    diff: updates,
    reason: 'Task edit',
    request_id: req.id
  });

  // Return success response
  res.status(200).json({
    task: updatedTask.toJSON(),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/tasks/:taskId/approve
 *
 * Approve a task (US2 - approval workflow)
 */
router.post('/:taskId/approve', authenticate, asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await GeneratedTask.findById(taskId);

  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Approve task
  const approvedTask = await task.approve(req.user.id);

  // Create audit event
  await AuditEvent.create({
    entity_type: 'TASK',
    entity_id: task.id,
    action: 'APPROVE',
    actor_id: req.user.id,
    reason: 'Task approved',
    request_id: req.id
  });

  // Return success response
  res.status(200).json({
    task: approvedTask.toJSON(),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/tasks/:taskId/reject
 *
 * Reject a task (US2 - rejection workflow)
 */
router.post('/:taskId/reject', authenticate, asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await GeneratedTask.findById(taskId);

  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Reject task
  const rejectedTask = await task.reject(req.user.id);

  // Create audit event
  await AuditEvent.create({
    entity_type: 'TASK',
    entity_id: task.id,
    action: 'REJECT',
    actor_id: req.user.id,
    reason: 'Task rejected',
    request_id: req.id
  });

  // Return success response
  res.status(200).json({
    task: rejectedTask.toJSON(),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/batches/:batchId/bulk-update
 *
 * Bulk update tasks (US2 - bulk operations)
 *
 * Request body:
 * {
 *   taskIds: string[]
 *   action: 'approve' | 'reject'
 * }
 */
router.post('/batches/:batchId/bulk-update', authenticate, asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const { taskIds, action } = req.body;

  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    throw new ApiError(
      'taskIds array is required',
      ErrorCodes.INVALID_INPUT,
      400
    );
  }

  if (!['approve', 'reject'].includes(action)) {
    throw new ApiError(
      'Action must be either "approve" or "reject"',
      ErrorCodes.INVALID_INPUT,
      400
    );
  }

  const batch = await SuggestionBatch.findById(batchId);

  if (!batch) {
    return res.status(404).json({
      error: 'Batch not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Bulk update
  const updatedCount = await GeneratedTask.bulkUpdateStatus(
    taskIds,
    action.toUpperCase(),
    req.user.id
  );

  // Create audit events for each task
  for (const taskId of taskIds) {
    await AuditEvent.create({
      entity_type: 'TASK',
      entity_id: taskId,
      action: action.toUpperCase(),
      actor_id: req.user.id,
      reason: `Bulk ${action}`,
      request_id: req.id
    });
  }

  // Return success response
  res.status(200).json({
    updatedCount,
    action,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/batches/:batchId/validate
 *
 * Validate batch before publishing (US2 - validation gate)
 *
 * Response:
 * {
 *   valid: boolean
 *   errors: string[]
 *   approved_count: number
 *   draft_count: number
 *   rejected_count: number
 * }
 */
router.post('/batches/:batchId/validate', authenticate, asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  const batch = await SuggestionBatch.findById(batchId);

  if (!batch) {
    return res.status(404).json({
      error: 'Batch not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Validate batch
  const validation = await batch.validate();

  // Return success response
  res.status(200).json({
    ...validation,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/batches/:batchId/publish
 *
 * Publish approved tasks (US2 - publish workflow)
 * Uses idempotency key to prevent duplicate publishing
 *
 * Request body:
 * {
 *   idempotency_key: string (required)
 *   options?: {
 *     dryRun?: boolean
 *     forceError?: boolean
 *   }
 * }
 */
router.post('/batches/:batchId/publish', authenticate, asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const { idempotency_key, options = {} } = req.body;

  if (!idempotency_key) {
    throw new ApiError(
      'idempotency_key is required',
      ErrorCodes.INVALID_INPUT,
      400
    );
  }

  const batch = await SuggestionBatch.findById(batchId);

  if (!batch) {
    return res.status(404).json({
      error: 'Batch not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Validate batch before publishing
  const validation = await batch.validate();
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Cannot publish batch',
      validation,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Get approved tasks
    const approvedTasks = await batch.getApprovedTasks();

    // Publish to Jira (mock for now)
    const publishResult = await publishIssues(approvedTasks, {
      dryRun: options.dryRun,
      forceError: options.forceError,
      requestId: req.id,
      disableRandomErrors: true // Disable random errors for P4
    });

    // Publish batch (update status and create issues)
    const batchResult = await batch.publish(req.user.id, idempotency_key);

    // Update tasks with Jira issue IDs (in real implementation)
    if (publishResult.issues && publishResult.issues.length > 0) {
      for (let i = 0; i < publishResult.issues.length; i++) {
        const jiraIssue = publishResult.issues[i];
        const task = approvedTasks[i];
        if (task && jiraIssue.jiraId) {
          await task.update(
            {
              jira_issue_id: jiraIssue.jiraId,
              jira_issue_key: jiraIssue.key
            },
            task.version
          );
        }
      }
    }

    // Create audit event
    await AuditEvent.create({
      entity_type: 'BATCH',
      entity_id: batch.id,
      action: 'PUBLISH',
      actor_id: req.user.id,
      reason: 'Batch published',
      request_id: req.id,
      diff: {
        published_count: publishResult.publishedCount,
        idempotency_key
      }
    });

    // Return success response
    res.status(200).json({
      published: true,
      publishedCount: publishResult.publishedCount,
      issues: publishResult.issues,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Create audit event for failure
    await AuditEvent.create({
      entity_type: 'BATCH',
      entity_id: batch.id,
      action: 'PUBLISH',
      actor_id: req.user.id,
      reason: `Publish failed: ${error.message}`,
      request_id: req.id
    });

    throw error;
  }
}));

/**
 * POST /api/batches/:batchId/discard
 *
 * Discard a batch without publishing
 */
router.post('/batches/:batchId/discard', authenticate, asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  const batch = await SuggestionBatch.findById(batchId);

  if (!batch) {
    return res.status(404).json({
      error: 'Batch not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Discard batch
  await batch.discard();

  // Create audit event
  await AuditEvent.create({
    entity_type: 'BATCH',
    entity_id: batch.id,
    action: 'DISCARD',
    actor_id: req.user.id,
    reason: 'Batch discarded',
    request_id: req.id
  });

  // Return success response
  res.status(200).json({
    success: true,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

export { router as default, router as tasksRouter };
