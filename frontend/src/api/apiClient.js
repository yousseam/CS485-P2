/**
 * API client for AI Specification Breakdown.
 * Connects to the backend API, with mock API as fallback.
 */

import * as mockApi from './mockApi.js';

// API base URL - can be overridden via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const DISABLE_MOCK_FALLBACK = import.meta.env.VITE_DISABLE_MOCK_FALLBACK === 'true';

/**
 * Make an HTTP request to the backend API
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body.message || body.error || body.code || 'API_ERROR';
    const err = new Error(msg);
    err.code = body.code;
    throw err;
  }

  return response.json();
}

/**
 * Generate Jira issues from specification text.
 * @param {string} specText - Raw specification text
 * @param {{ forceError?: boolean }} [options]
 * @returns {Promise<{ issues: import('./mockApi.js').Issue[] }>}
 */
export async function generateIssues(specText, options = {}) {
  if (USE_MOCK) {
    console.log('[apiClient] Using mock API for generateIssues');
    return mockApi.generateIssues(specText, options);
  }

  console.log('[apiClient] Calling backend API for generateIssues');
  try {
    const data = await apiRequest('/generate-issues', {
      method: 'POST',
      body: JSON.stringify({ specText, options }),
    });

    return data;
  } catch (error) {
    console.error('[apiClient] Error calling backend API:', error);
    if (DISABLE_MOCK_FALLBACK) throw error;
    // Fallback to mock API if backend is unavailable (legacy behavior)
    console.log('[apiClient] Falling back to mock API');
    return mockApi.generateIssues(specText, options);
  }
}

/**
 * Publish issues to Jira.
 * @param {import('./mockApi.js').Issue[]} issues - Issues to publish
 * @param {{ forceError?: boolean }} [options]
 * @returns {Promise<{ publishedCount: number, projectKey: string }>}
 */
export async function publishIssues(issues, options = {}) {
  if (USE_MOCK) {
    console.log('[apiClient] Using mock API for publishIssues');
    return mockApi.publishIssues(issues, options);
  }

  console.log('[apiClient] Calling backend API for publishIssues');
  try {
    const data = await apiRequest('/publish-issues', {
      method: 'POST',
      body: JSON.stringify({ issues, options }),
    });

    return data;
  } catch (error) {
    console.error('[apiClient] Error calling backend API:', error);
    if (DISABLE_MOCK_FALLBACK) throw error;
    // Fallback to mock API if backend is unavailable (legacy behavior)
    console.log('[apiClient] Falling back to mock API');
    return mockApi.publishIssues(issues, options);
  }
}

export { readSpecFromFile } from './mockApi.js';
