/**
 * Load env files into process.env (later files override earlier).
 * 1) Repository root .env  — e.g. C:\...\CS485-P2\.env (common when vars live next to docker-compose)
 * 2) backend/.env         — wins over root for duplicate keys
 *
 * Import this module once before reading process.env for DB_*.
 */

import dotenv from 'dotenv'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function applyEnvFile(absPath) {
  if (!existsSync(absPath)) return
  const parsed = dotenv.parse(readFileSync(absPath))
  for (const [k, v] of Object.entries(parsed)) {
    process.env[k] = v
  }
}

// Root first, then backend (backend wins)
applyEnvFile(join(__dirname, '..', '.env'))
applyEnvFile(join(__dirname, '.env'))
