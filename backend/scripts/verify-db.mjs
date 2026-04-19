/**
 * Print resolved DB settings (no password) and try one connection.
 * Run: cd backend && node scripts/verify-db.mjs
 */

import '../load-env.mjs'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
// scripts/ → backend/.env is ../.env ; repo root .env is ../../.env
const backendEnvPath = join(__dirname, '..', '.env')
const rootEnvPath = join(__dirname, '..', '..', '.env')

function findDbPortLine(filePath) {
  if (!existsSync(filePath)) return { exists: false, line: null }
  const raw = readFileSync(filePath, 'utf8')
  const line = raw.split(/\r?\n/).find((l) => /^[\s\uFEFF]*DB_PORT\s*=/i.test(l))
  return { exists: true, line: line ? line.trim() : null }
}

const host = process.env.DB_HOST || 'localhost'
const port = parseInt(String(process.env.DB_PORT || '5432').trim(), 10)
const database = process.env.DB_NAME || 'ai_spec_breakdown'
const user = process.env.DB_USER || 'postgres'
const password = process.env.DB_PASSWORD ?? 'postgres'
const nodeEnv = process.env.NODE_ENV || '(unset)'

const rootPort = findDbPortLine(rootEnvPath)
const backendPort = findDbPortLine(backendEnvPath)

console.log('Resolved config:', {
  rootEnvFile: rootEnvPath,
  rootEnvExists: rootPort.exists,
  dbPortLineInRoot: rootPort.line ?? '(none)',
  backendEnvFile: backendEnvPath,
  backendEnvExists: backendPort.exists,
  dbPortLineInBackend: backendPort.line ?? '(none)',
  host,
  port,
  database,
  user,
  NODE_ENV: nodeEnv,
  passwordLength: password.length,
  passwordIsDefaultPostgres: password === 'postgres',
})

const client = new pg.Client({
  host,
  port,
  database,
  user,
  password,
  ssl: false,
})

try {
  await client.connect()
  const r = await client.query('SELECT current_database(), inet_server_addr(), inet_server_port()')
  console.log('OK:', r.rows[0])
} catch (e) {
  console.error('CONNECT FAILED:', e.message)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
