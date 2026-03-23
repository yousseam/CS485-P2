/**
 * Generated Task Model
 * Represents AI-generated tasks (issues) that can be edited before publishing
 * This is the key entity for US1-US2 dependency - persisted drafts, not in-memory!
 */

import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../database/connection.js';
import { ApiError, ErrorCodes } from '../middleware/errorHandler.js';

export class GeneratedTask {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.batch_id = data.batch_id;
    this.project_id = data.project_id;
    this.source = data.source || 'AI';

    // Issue fields
    this.task_type = data.task_type || 'story'; // 'epic' or 'story'
    this.title = data.title;
    this.description = data.description;
    this.acceptance_criteria = data.acceptance_criteria || [];

    // Metadata
    this.suggested_priority = data.suggested_priority;
    this.suggested_story_points = data.suggested_story_points;
    this.size = data.size;
    this.tags = data.tags || [];
    this.flagged_as_gap = data.flagged_as_gap || false;
    this.confidence_score = data.confidence_score;

    // Status and approval
    this.status = data.status || 'DRAFT'; // DRAFT, APPROVED, REJECTED
    this.sort_order = data.sort_order || 0;
    this.jira_issue_id = data.jira_issue_id;
    this.jira_issue_key = data.jira_issue_key;

    // Version tracking for optimistic locking
    this.version = data.version || 1;

    // Edit tracking
    this.last_edited_by = data.last_edited_by;
    this.last_edited_at = data.last_edited_at;

    // AI metadata (raw LLM output for traceability)
    this.generated_payload = data.generated_payload;

    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Create a new generated task (persisted, not in-memory!)
   */
  static async create(data) {
    // Validate required fields
    if (!data.batch_id || !data.project_id || !data.title || !data.description) {
      throw new ApiError(
        'batch_id, project_id, title, and description are required',
        ErrorCodes.INVALID_INPUT,
        400
      );
    }

    const result = await query(
      `INSERT INTO generated_tasks
        (batch_id, project_id, source, task_type, title, description,
         acceptance_criteria, suggested_priority, suggested_story_points,
         size, tags, flagged_as_gap, confidence_score, status,
         sort_order, version, generated_payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'DRAFT', $14, 1, $15)
       RETURNING *`,
      [
        data.batch_id,
        data.project_id,
        data.source || 'AI',
        data.task_type || 'story',
        data.title,
        data.description,
        data.acceptance_criteria || [],
        data.suggested_priority,
        data.suggested_story_points,
        data.size,
        data.tags || [],
        data.flagged_as_gap || false,
        data.confidence_score,
        data.sort_order || 0,
        data.generated_payload
      ]
    );

    return new GeneratedTask(result.rows[0]);
  }

  /**
   * Create multiple tasks in bulk
   */
  static async createMany(tasksData) {
    if (tasksData.length === 0) {
      return [];
    }

    return await transaction(async (client) => {
      const createdTasks = [];

      for (const data of tasksData) {
        const result = await client.query(
          `INSERT INTO generated_tasks
            (batch_id, project_id, source, task_type, title, description,
             acceptance_criteria, suggested_priority, suggested_story_points,
             size, tags, flagged_as_gap, confidence_score, status,
             sort_order, version, generated_payload)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'DRAFT', $14, 1, $15)
           RETURNING *`,
          [
            data.batch_id,
            data.project_id,
            data.source || 'AI',
            data.task_type || 'story',
            data.title,
            data.description,
            data.acceptance_criteria || [],
            data.suggested_priority,
            data.suggested_story_points,
            data.size,
            data.tags || [],
            data.flagged_as_gap || false,
            data.confidence_score,
            data.sort_order || 0,
            data.generated_payload
          ]
        );

        createdTasks.push(new GeneratedTask(result.rows[0]));
      }

      return createdTasks;
    });
  }

  /**
   * Find task by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM generated_tasks WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new GeneratedTask(result.rows[0]);
  }

  /**
   * Find tasks by batch
   */
  static async findByBatch(batchId) {
    const result = await query(
      `SELECT * FROM generated_tasks
       WHERE batch_id = $1
       ORDER BY sort_order, created_at`,
      [batchId]
    );

    return result.rows.map(row => new GeneratedTask(row));
  }

  /**
   * Find approved tasks by batch
   */
  static async findApprovedByBatch(batchId) {
    const result = await query(
      `SELECT * FROM generated_tasks
       WHERE batch_id = $1 AND status = 'APPROVED'
       ORDER BY sort_order, created_at`,
      [batchId]
    );

    return result.rows.map(row => new GeneratedTask(row));
  }

  /**
   * Update task with optimistic locking
   */
  async update(updates, expectedVersion) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.task_type !== undefined) {
      fields.push(`task_type = $${paramCount++}`);
      values.push(updates.task_type);
    }

    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    if (updates.acceptance_criteria !== undefined) {
      fields.push(`acceptance_criteria = $${paramCount++}`);
      values.push(updates.acceptance_criteria);
    }

    if (updates.suggested_priority !== undefined) {
      fields.push(`suggested_priority = $${paramCount++}`);
      values.push(updates.suggested_priority);
    }

    if (updates.suggested_story_points !== undefined) {
      fields.push(`suggested_story_points = $${paramCount++}`);
      values.push(updates.suggested_story_points);
    }

    if (updates.size !== undefined) {
      fields.push(`size = $${paramCount++}`);
      values.push(updates.size);
    }

    if (updates.tags !== undefined) {
      fields.push(`tags = $${paramCount++}`);
      values.push(updates.tags);
    }

    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }

    if (updates.sort_order !== undefined) {
      fields.push(`sort_order = $${paramCount++}`);
      values.push(updates.sort_order);
    }

    if (updates.last_edited_by !== undefined) {
      fields.push(`last_edited_by = $${paramCount++}`);
      values.push(updates.last_edited_by);
    }

    fields.push(`version = version + 1`);
    fields.push(`last_edited_at = NOW()`);
    fields.push(`updated_at = NOW()`);
    values.push(this.id);
    values.push(expectedVersion || this.version);

    const result = await query(
      `UPDATE generated_tasks
       SET ${fields.join(', ')}
       WHERE id = $${paramCount} AND version = $${paramCount + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new ApiError(
        'Update failed: task was modified by another user. Please refresh and try again.',
        ErrorCodes.VERSION_CONFLICT,
        409
      );
    }

    return new GeneratedTask(result.rows[0]);
  }

  /**
   * Approve task
   */
  async approve(editedBy) {
    return await this.update(
      { status: 'APPROVED', last_edited_by: editedBy },
      this.version
    );
  }

  /**
   * Reject task
   */
  async reject(editedBy) {
    return await this.update(
      { status: 'REJECTED', last_edited_by: editedBy },
      this.version
    );
  }

  /**
   * Delete task
   */
  async delete() {
    await query('DELETE FROM generated_tasks WHERE id = $1', [this.id]);
    return true;
  }

  /**
   * Bulk update status for multiple tasks
   */
  static async bulkUpdateStatus(taskIds, status, editedBy) {
    if (taskIds.length === 0) {
      return 0;
    }

    const result = await query(
      `UPDATE generated_tasks
       SET status = $1, last_edited_by = $2, last_edited_at = NOW(), updated_at = NOW()
       WHERE id = ANY($3)`,
      [status, editedBy, taskIds]
    );

    return result.rowCount;
  }

  /**
   * Convert to JSON (for API responses)
   */
  toJSON() {
    return {
      id: this.id,
      batch_id: this.batch_id,
      project_id: this.project_id,
      source: this.source,
      task_type: this.task_type,
      title: this.title,
      description: this.description,
      acceptance_criteria: this.acceptance_criteria,
      suggested_priority: this.suggested_priority,
      suggested_story_points: this.suggested_story_points,
      size: this.size,
      tags: this.tags,
      flagged_as_gap: this.flagged_as_gap,
      confidence_score: this.confidence_score,
      status: this.status,
      sort_order: this.sort_order,
      jira_issue_id: this.jira_issue_id,
      jira_issue_key: this.jira_issue_key,
      version: this.version,
      last_edited_by: this.last_edited_by,
      last_edited_at: this.last_edited_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default GeneratedTask;
