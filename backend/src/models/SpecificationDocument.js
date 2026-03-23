/**
 * Specification Document Model
 * Represents uploaded specification documents
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection.js';
import { ApiError, ErrorCodes } from '../middleware/errorHandler.js';

export class SpecificationDocument {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.project_id = data.project_id;
    this.file_name = data.file_name;
    this.file_type = data.file_type;
    this.storage_key = data.storage_key;
    this.raw_text = data.raw_text;
    this.upload_date = data.upload_date || new Date();
    this.status = data.status || 'Processing';
    this.failure_reason = data.failure_reason;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Create a new specification document
   */
  static async create({ project_id, file_name, file_type, storage_key, raw_text }) {
    // Validate input
    if (!project_id || !file_name || !file_type || !raw_text) {
      throw new ApiError(
        'project_id, file_name, file_type, and raw_text are required',
        ErrorCodes.INVALID_INPUT,
        400
      );
    }

    const result = await query(
      `INSERT INTO specification_documents
        (project_id, file_name, file_type, storage_key, raw_text, status)
       VALUES ($1, $2, $3, $4, $5, 'Processing')
       RETURNING *`,
      [project_id, file_name, file_type, storage_key, raw_text]
    );

    return new SpecificationDocument(result.rows[0]);
  }

  /**
   * Find document by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM specification_documents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new SpecificationDocument(result.rows[0]);
  }

  /**
   * Find documents by project
   */
  static async findByProject(project_id) {
    const result = await query(
      `SELECT * FROM specification_documents
       WHERE project_id = $1
       ORDER BY upload_date DESC`,
      [project_id]
    );

    return result.rows.map(row => new SpecificationDocument(row));
  }

  /**
   * Update document status
   */
  async updateStatus(status, failureReason = null) {
    const result = await query(
      `UPDATE specification_documents
       SET status = $1, failure_reason = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, failureReason, this.id]
    );

    return new SpecificationDocument(result.rows[0]);
  }

  /**
   * Delete document
   */
  async delete() {
    await query('DELETE FROM specification_documents WHERE id = $1', [this.id]);
    return true;
  }

  /**
   * Get all suggestion batches for this document
   */
  async getSuggestionBatches() {
    const result = await query(
      `SELECT * FROM suggestion_batches
       WHERE document_id = $1
       ORDER BY created_at DESC`,
      [this.id]
    );

    return result.rows.map(row => ({
      id: row.id,
      document_id: row.document_id,
      status: row.status,
      prompt_version: row.prompt_version,
      model: row.model,
      created_by: row.created_by,
      created_at: row.created_at,
      published_at: row.published_at,
      published_by: row.published_by
    }));
  }

  /**
   * Get the latest completed suggestion batch
   */
  async getLatestCompletedBatch() {
    const result = await query(
      `SELECT * FROM suggestion_batches
       WHERE document_id = $1 AND status IN ('DRAFT', 'PUBLISHED')
       ORDER BY created_at DESC
       LIMIT 1`,
      [this.id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      project_id: this.project_id,
      file_name: this.file_name,
      file_type: this.file_type,
      storage_key: this.storage_key,
      upload_date: this.upload_date,
      status: this.status,
      failure_reason: this.failure_reason,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default SpecificationDocument;
