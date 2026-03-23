/**
 * Project Model
 * Represents project containers for specifications and tasks
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection.js';
import { ApiError, ErrorCodes } from '../middleware/errorHandler.js';

export class Project {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description;
    this.owner_id = data.owner_id;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Create a new project
   */
  static async create({ name, description, owner_id }) {
    // Validate input
    if (!name || !owner_id) {
      throw new ApiError('Name and owner_id are required', ErrorCodes.INVALID_INPUT, 400);
    }

    const result = await query(
      `INSERT INTO projects (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, owner_id]
    );

    return new Project(result.rows[0]);
  }

  /**
   * Find project by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new Project(result.rows[0]);
  }

  /**
   * Find projects by owner
   */
  static async findByOwner(owner_id) {
    const result = await query(
      `SELECT * FROM projects
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [owner_id]
    );

    return result.rows.map(row => new Project(row));
  }

  /**
   * Update project
   */
  async update(updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    if (fields.length === 0) {
      return this;
    }

    fields.push(`updated_at = NOW()`);
    values.push(this.id);

    const result = await query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return new Project(result.rows[0]);
  }

  /**
   * Delete project
   */
  async delete() {
    await query('DELETE FROM projects WHERE id = $1', [this.id]);
    return true;
  }

  /**
   * Get all specification documents for this project
   */
  async getDocuments() {
    const result = await query(
      `SELECT * FROM specification_documents
       WHERE project_id = $1
       ORDER BY upload_date DESC`,
      [this.id]
    );

    return result.rows.map(row => ({
      id: row.id,
      project_id: row.project_id,
      file_name: row.file_name,
      file_type: row.file_type,
      storage_key: row.storage_key,
      upload_date: row.upload_date,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      owner_id: this.owner_id,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default Project;
