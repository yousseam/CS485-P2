/**
 * Audit Event Model
 * Append-only log of all changes to the system
 * Critical for accountability and compliance
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection.js';

export class AuditEvent {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.entity_type = data.entity_type;
    this.entity_id = data.entity_id;
    this.action = data.action;
    this.actor_id = data.actor_id;
    this.timestamp = data.timestamp || new Date();
    this.diff = data.diff;
    this.reason = data.reason;
    this.request_id = data.request_id;
  }

  /**
   * Create a new audit event
   */
  static async create({ entity_type, entity_id, action, actor_id, diff, reason, request_id }) {
    // Validate required fields
    if (!entity_type || !entity_id || !action || !actor_id) {
      throw new Error('entity_type, entity_id, action, and actor_id are required');
    }

    const result = await query(
      `INSERT INTO audit_events
        (entity_type, entity_id, action, actor_id, diff, reason, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [entity_type, entity_id, action, actor_id, diff, reason, request_id]
    );

    return new AuditEvent(result.rows[0]);
  }

  /**
   * Find events by entity
   */
  static async findByEntity(entityType, entityId) {
    const result = await query(
      `SELECT * FROM audit_events
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY timestamp DESC`,
      [entityType, entityId]
    );

    return result.rows.map(row => new AuditEvent(row));
  }

  /**
   * Find events by actor
   */
  static async findByActor(actorId) {
    const result = await query(
      `SELECT * FROM audit_events
       WHERE actor_id = $1
       ORDER BY timestamp DESC
       LIMIT 100`,
      [actorId]
    );

    return result.rows.map(row => new AuditEvent(row));
  }

  /**
   * Find events by request ID (for tracing)
   */
  static async findByRequestId(requestId) {
    const result = await query(
      `SELECT * FROM audit_events
       WHERE request_id = $1
       ORDER BY timestamp ASC`,
      [requestId]
    );

    return result.rows.map(row => new AuditEvent(row));
  }

  /**
   * Get recent events for monitoring
   */
  static async getRecent(limit = 50) {
    const result = await query(
      `SELECT * FROM audit_events
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => new AuditEvent(row));
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      entity_type: this.entity_type,
      entity_id: this.entity_id,
      action: this.action,
      actor_id: this.actor_id,
      timestamp: this.timestamp,
      diff: this.diff,
      reason: this.reason,
      request_id: this.request_id
    };
  }
}

export default AuditEvent;
