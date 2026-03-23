/**
 * Projects API Routes
 * Handles project CRUD operations
 */

import express from 'express';
import { Project } from '../models/Project.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { AuditEvent } from '../models/AuditEvent.js';

const router = express.Router();

/**
 * POST /api/projects
 *
 * Create a new project
 *
 * Request body:
 * {
 *   name: string (required)
 *   description?: string
 * }
 *
 * Response:
 * {
 *   project: { id, name, description, owner_id, created_at, updated_at }
 * }
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Create project
  const project = await Project.create({
    name,
    description,
    owner_id: req.user.id
  });

  // Create audit event
  await AuditEvent.create({
    entity_type: 'PROJECT',
    entity_id: project.id,
    action: 'CREATE',
    actor_id: req.user.id,
    reason: 'Project creation',
    request_id: req.id
  });

  // Return success response
  res.status(201).json({
    project: project.toJSON(),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/projects
 *
 * Get all projects for the current user
 *
 * Response:
 * {
 *   projects: Array<{ id, name, description, owner_id, created_at, updated_at }>
 * }
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const projects = await Project.findByOwner(req.user.id);

  // Return success response
  res.status(200).json({
    projects: projects.map(p => p.toJSON()),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/projects/:id
 *
 * Get a specific project
 *
 * Response:
 * {
 *   project: { id, name, description, owner_id, created_at, updated_at }
 * }
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Check if user owns the project
  if (project.owner_id !== req.user.id) {
    return res.status(403).json({
      error: 'You do not have permission to access this project',
      code: 'FORBIDDEN',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Return success response
  res.status(200).json({
    project: project.toJSON(),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * PATCH /api/projects/:id
 *
 * Update a project
 *
 * Request body:
 * {
 *   name?: string
 *   description?: string
 * }
 *
 * Response:
 * {
 *   project: { id, name, description, owner_id, created_at, updated_at }
 * }
 */
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Check if user owns the project
  if (project.owner_id !== req.user.id) {
    return res.status(403).json({
      error: 'You do not have permission to update this project',
      code: 'FORBIDDEN',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Update project
  const updatedProject = await project.update({ name, description });

  // Create audit event
  await AuditEvent.create({
    entity_type: 'PROJECT',
    entity_id: project.id,
    action: 'UPDATE',
    actor_id: req.user.id,
    diff: { name, description },
    reason: 'Project update',
    request_id: req.id
  });

  // Return success response
  res.status(200).json({
    project: updatedProject.toJSON(),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

/**
 * DELETE /api/projects/:id
 *
 * Delete a project
 *
 * Response:
 * {
 *   success: true
 * }
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      code: 'NOT_FOUND',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Check if user owns the project
  if (project.owner_id !== req.user.id) {
    return res.status(403).json({
      error: 'You do not have permission to delete this project',
      code: 'FORBIDDEN',
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }

  // Delete project (cascade will delete related documents and tasks)
  await project.delete();

  // Create audit event
  await AuditEvent.create({
    entity_type: 'PROJECT',
    entity_id: project.id,
    action: 'DELETE',
    actor_id: req.user.id,
    reason: 'Project deletion',
    request_id: req.id
  });

  // Return success response
  res.status(200).json({
    success: true,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
}));

export { router as default, router as projectsRouter };
