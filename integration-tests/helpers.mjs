/**
 * Shared helpers for HTTP integration tests (same paths as frontend/src/api/apiClient.js).
 */

export function getApiBaseUrl() {
  const raw =
    process.env.INTEGRATION_API_BASE_URL || 'http://localhost:3001/api'
  return raw.replace(/\/$/, '')
}

/**
 * @param {string} path - e.g. '/health' (appended to .../api)
 * @param {RequestInit} [init]
 */
export async function apiFetch(path, init = {}) {
  const base = getApiBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${p}`
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

export function isCloudTarget() {
  return (
    process.env.INTEGRATION_TARGET === 'cloud' ||
    getApiBaseUrl().includes('amazonaws.com')
  )
}
