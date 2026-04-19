/**
 * Database Connection Pool
 * Manages PostgreSQL connection pool for the application
 * Supports up to 10 concurrent users
 */

import '../../load-env.mjs';
import pg from 'pg';

const { Pool } = pg;

// Connection pool configuration
// Supports 10 simultaneous frontend users
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'ai_spec_breakdown',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',

  // Connection pool settings for 10 concurrent users
  max: 20, // Maximum pool size (2x users for headroom)
  min: 2, // Minimum pool size
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Give up connecting after 10s

  // SSL: use for remote RDS in production. Local Docker Postgres has no TLS — SSL here can break localhost.
  ssl:
    process.env.NODE_ENV === 'production' &&
    process.env.DB_SSL !== 'false' &&
    !['localhost', '127.0.0.1'].includes((process.env.DB_HOST || '').trim())
      ? { rejectUnauthorized: false }
      : false,

  // Logging
  log: process.env.NODE_ENV === 'development'
    ? (msg) => console.log('[DB]', msg)
    : undefined
};

// Create connection pool
const pool = new Pool(poolConfig);

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✓ Database connected successfully:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Get a client from the pool
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Execute a query with parameters
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB Query] ${duration}ms: ${text.substring(0, 50)}...`);
    }

    return result;
  } catch (error) {
    console.error('[DB Query Error]', error.message);
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Graceful shutdown
 */
export async function closePool() {
  console.log('Closing database connection pool...');
  await pool.end();
  console.log('✓ Database connection pool closed');
}

/**
 * Health check for monitoring
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

// Export the pool for direct access if needed
export default pool;
