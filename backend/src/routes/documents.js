/**
 * Documents API Routes
 * Handles specification document upload and management
 * Critical for US1 (AI breakdown)
 */

import express from 'express';
import { SpecificationDocument } from '../models/SpecificationDocument.js';
import { generateIssues } from '../services/issueGenerator.js';
import { SuggestionBatch } from '../models/SuggestionBatch.js';
import { GeneratedTask } from '../models/GeneratedTask.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { ApiError, ErrorCodes } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/documents
 *
 * Upload a specification document and generate AI issues (US1)
 *
 * Request body:
 * {
 *   project_id: string (required)
 *   file_name: string (required)
 *   file_type: string (required)
 *   raw_text: string (required) - Extracted text content
 *   options?: {
 *     useAI?: 'auto' | 'true' | 'false'
 *     aiProvider?: 'openai' | 'anthropic' | 'gemini' | 'auto'
 *   }
 * }
 *
 * Response:
 * {
 *   document: { id, project_id, file_name, status, ... }
 *   batch?: { id, status, ... } - if generation succeeded
 *   issues?: Array - generated issues
 * }
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { project_id, file_name, file_type, raw_text, options = {} } = req.body;

  // Validate input
  if (!project_id || !file_name || !file_type || !raw_text) {
    throw new ApiError(
      'project_id, file_name, file_type, and raw_text are required',
      ErrorCodes.INVALID_INPUT,
      400
    );
  }

  // Create document
  const document = await SpecificationDocument.create({
    project_id,
    file_name,
    file_type,
    storage_key: null, // TODO: Implement S3 storage in P5
    raw_text
  });

  try {
    // Generate issues using AI (US1)
    const result = await generateIssues(raw_text, {
      requestId: req.id,
      ...options
    });

    // Create suggestion batch (persisted, not in-memory!)
    const batch = await SuggestionBatch.create({
      document_id: document.id,
      prompt_version: options.prompt_version || 'v1',
      model: result.aiMetadata?.model || 'mock',
      created_by: req.user.id
    });

    // Persist generated tasks (persisted, not in-memory!)
    const tasksData = result.issues.map((issue, index) => ({
      batch_id: batch.id,
      project_id: project_id,
      source: result.usedAI ? 'AI' : 'AI_MOCK',
      task_type: issue.type === 'epic' ? 'epic' : 'story',
      title: issue.summary,
      description: issue.description,
      acceptance_criteria: issue.acceptanceCriteria || [],
      suggested_priority: null, // Not in current mock data
      suggested_story_points: null,
      size: issue.size || null,
      tags: [],
      flagged_as_gap: false,
      confidence_score: result.aiMetadata?.confidence,
      sort_order: index,
      generated_payload: result.aiMetadata
    }));

    await GeneratedTask.createMany(tasksData);

    // Update document status to completed
    await document.updateStatus('Completed');

    // Create audit event
    await AuditEvent.create({
      entity_type: 'DOCUMENT',
      entity_id: document.id,
      action: 'CREATE',
      actor_id: req.user.id,
      reason: 'Document upload and AI generation',
      request_id: req.id,
      diff: {
        file_name,
        file_type,
        tasks_generated: tasksData.length,
        used_ai: result.usedAI
      }
    });

    // Return success response
    res.status(201).json({
      document: document.toJSON(),
      batch: batch.toJSON(),
      issues: result.issues,
      analysis: result.analysis,
      usedAI: result.usedAI,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Update document status to failed
    await document.updateStatus('Failed', error.message);

    // Create audit event for failure
    await AuditEvent.create({
      entity_type: 'DOCUMENT',
      entity_id: document.id,
      action: 'CREATE',
      actor_id: req.user.id,
      reason: 'Document upload failed',
      request_id: req.id,
      diff: {
        file_name,
        file_type,
        error: error.message
      }
    });

    throw error;
  }
}));

/**
 * GET /api/documents/:id
 *
 * Get a specific document
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const document = await SpecificationDocument.findById(id);

  if (!document) {
    return res.status(404).json({
      error: 'Document not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Return success response
  res.status(200).json({
    document: document.toJSON(),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/documents/:id/batches
 *
 * Get all suggestion batches for a document
 */
router.get('/:id/batches', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const document = await SpecificationDocument.findById(id);

  if (!document) {
    return res.status(404).json({
      error: 'Document not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  const batches = await document.getSuggestionBatches();

  // Return success response
  res.status(200).json({
    batches,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/projects/:projectId/documents
 *
 * Get all documents for a project
 */
router.get('/project/:projectId', authenticate, asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Note: In a real implementation, we'd check if user has access to the project
  const documents = await SpecificationDocument.findByProject(projectId);

  // Return success response
  res.status(200).json({
    documents: documents.map(d => d.toJSON()),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

export { router as default, router as documentsRouter };
