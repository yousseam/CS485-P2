/**
 * Suggestion Batch Model
 * Represents one AI generation session tied to a specification
 * Critical for US1-US2 dependency: suggestions are persisted, not in-memory!
 */

import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../database/connection.js';
import { ApiError, ErrorCodes } from '../middleware/errorHandler.js';

export class SuggestionBatch {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.document_id = data.document_id;
    this.status = data.status || 'DRAFT';
    this.prompt_version = data.prompt_version;
    this.model = data.model;
    this.created_by = data.created_by;
    this.created_at = data.created_at || new Date();
    this.published_at = data.published_at;
    this.published_by = data.published_by;
    this.idempotency_key_last_publish = data.idempotency_key_last_publish;
  }

  /**
   * Create a new suggestion batch (persisted, not in-memory!)
   */
  static async create({ document_id, prompt_version, model, created_by }) {
    // Validate input
    if (!document_id || !created_by) {
      throw new ApiError(
        'document_id and created_by are required',
        ErrorCodes.INVALID_INPUT,
        400
      );
    }

    const result = await query(
      `INSERT INTO suggestion_batches
        (document_id, status, prompt_version, model, created_by)
       VALUES ($1, 'DRAFT', $2, $3, $4)
       RETURNING *`,
      [document_id, prompt_version, model, created_by]
    );

    return new SuggestionBatch(result.rows[0]);
  }

  /**
   * Find batch by ID
   */
  static async findById(id) {
    const result = await query(
      `SELECT * FROM suggestion_batches WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new SuggestionBatch(result.rows[0]);
  }

  /**
   * Find batches by document
   */
  static async findByDocument(document_id) {
    const result = await query(
      `SELECT * FROM suggestion_batches
       WHERE document_id = $1
       ORDER BY created_at DESC`,
      [document_id]
    );

    return result.rows.map(row => new SuggestionBatch(row));
  }

  /**
   * Publish batch (convert approved suggestions to issues)
   * Uses idempotency key to prevent duplicate publishing
   */
  async publish(publishedBy, idempotencyKey) {
    return await transaction(async (client) => {
      // Check idempotency
      if (this.idempotency_key_last_publish === idempotencyKey) {
        // Already published with this key, return existing result
        const existingResult = await client.query(
          `SELECT gt.id, gt.jira_issue_id, gt.jira_issue_key
           FROM generated_tasks gt
           WHERE gt.batch_id = $1 AND gt.status = 'APPROVED'`,
          [this.id]
        );

        return {
          already_published: true,
          published_count: existingResult.rows.length,
          issues: existingResult.rows
        };
      }

      // Update batch status
      await client.query(
        `UPDATE suggestion_batches
         SET status = 'PUBLISHED', published_at = NOW(), published_by = $1,
             idempotency_key_last_publish = $2
         WHERE id = $3`,
        [publishedBy, idempotencyKey, this.id]
      );

      // Mark all approved tasks as published (in real implementation, would create Jira issues)
      const result = await client.query(
        `UPDATE generated_tasks
         SET status = 'APPROVED', updated_at = NOW()
         WHERE batch_id = $1 AND status = 'APPROVED'
         RETURNING id, jira_issue_id, jira_issue_key`,
        [this.id]
      );

      return {
        already_published: false,
        published_count: result.rows.length,
        issues: result.rows
      };
    });
  }

  /**
   * Discard batch
   */
  async discard() {
    await query(
      `UPDATE suggestion_batches
       SET status = 'DISCARDED'
       WHERE id = $1`,
      [this.id]
    );

    return true;
  }

  /**
   * Get all tasks in this batch
   */
  async getTasks() {
    const result = await query(
      `SELECT * FROM generated_tasks
       WHERE batch_id = $1
       ORDER BY sort_order, created_at`,
      [this.id]
    );

    return result.rows.map(row => ({
      id: row.id,
      batch_id: row.batch_id,
      project_id: row.project_id,
      source: row.source,
      task_type: row.task_type,
      title: row.title,
      description: row.description,
      acceptance_criteria: row.acceptance_criteria,
      suggested_priority: row.suggested_priority,
      suggested_story_points: row.suggested_story_points,
      size: row.size,
      tags: row.tags,
      flagged_as_gap: row.flagged_as_gap,
      confidence_score: row.confidence_score,
      status: row.status,
      sort_order: row.sort_order,
      jira_issue_id: row.jira_issue_id,
      jira_issue_key: row.jira_issue_key,
      version: row.version,
      last_edited_by: row.last_edited_by,
      last_edited_at: row.last_edited_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * Get approved tasks only
   */
  async getApprovedTasks() {
    const result = await query(
      `SELECT * FROM generated_tasks
       WHERE batch_id = $1 AND status = 'APPROVED'
       ORDER BY sort_order, created_at`,
      [this.id]
    );

    return result.rows.map(row => ({
      id: row.id,
      batch_id: row.batch_id,
      project_id: row.project_id,
      task_type: row.task_type,
      title: row.title,
      description: row.description,
      acceptance_criteria: row.acceptance_criteria,
      suggested_priority: row.suggested_priority,
      suggested_story_points: row.suggested_story_points,
      size: row.size,
      tags: row.tags,
      status: row.status,
      jira_issue_id: row.jira_issue_id,
      jira_issue_key: row.jira_issue_key
    }));
  }

  /**
   * Validate batch before publishing
   */
  async validate() {
    const errors = [];

    // Check if batch is in draft status
    if (this.status !== 'DRAFT') {
      errors.push(`Batch status is '${this.status}', cannot publish`);
    }

    // Check if there are approved tasks
    const approvedTasks = await this.getApprovedTasks();
    if (approvedTasks.length === 0) {
      errors.push('No approved tasks to publish. Please approve at least one task.');
    }

    // Check for draft tasks (warn user)
    const allTasks = await this.getTasks();
    const draftTasks = allTasks.filter(t => t.status === 'DRAFT');
    if (draftTasks.length > 0) {
      errors.push(`${draftTasks.length} task(s) are still in DRAFT status and will not be published`);
    }

    return {
      valid: errors.length === 0,
      errors,
      approved_count: approvedTasks.length,
      draft_count: draftTasks.length,
      rejected_count: allTasks.filter(t => t.status === 'REJECTED').length
    };
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      document_id: this.document_id,
      status: this.status,
      prompt_version: this.prompt_version,
      model: this.model,
      created_by: this.created_by,
      created_at: this.created_at,
      published_at: this.published_at,
      published_by: this.published_by
    };
  }
}

export default SuggestionBatch;
