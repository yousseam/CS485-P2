/**
 * User Model
 * Represents application users (Project Leads and Developers)
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../database/connection.js';
import { ApiError, ErrorCodes } from '../middleware/errorHandler.js';

export class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.role = data.role || 'ProjectLead';
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Create a new user
   */
  static async create({ name, email, password, role = 'ProjectLead' }) {
    // Validate input
    if (!name || !email || !password) {
      throw new ApiError('Name, email, and password are required', ErrorCodes.INVALID_INPUT, 400);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, password_hash, role]
    );

    return new User(result.rows[0]);
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const result = await query(
      'SELECT id, name, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  /**
   * Verify password
   */
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password_hash);
  }

  /**
   * Update user
   */
  async update(updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }

    if (updates.password !== undefined) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(await bcrypt.hash(updates.password, 10));
    }

    if (updates.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }

    if (fields.length === 0) {
      return this;
    }

    fields.push(`updated_at = NOW()`);
    values.push(this.id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, role, created_at, updated_at`,
      values
    );

    return new User(result.rows[0]);
  }

  /**
   * Delete user
   */
  async delete() {
    await query('DELETE FROM users WHERE id = $1', [this.id]);
    return true;
  }

  /**
   * Get all projects for user
   */
  async getProjects() {
    const result = await query(
      `SELECT p.id, p.name, p.description, p.owner_id, p.created_at, p.updated_at
       FROM projects p
       WHERE p.owner_id = $1
       ORDER BY p.created_at DESC`,
      [this.id]
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      owner_id: row.owner_id,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * Convert to JSON (exclude password_hash)
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default User;
