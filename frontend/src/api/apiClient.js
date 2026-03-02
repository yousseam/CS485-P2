/**
 * API client for AI Specification Breakdown.
 * Currently delegates to mock API; replace with real fetch when backend is ready.
 */

import * as mockApi from './mockApi.js';

/**
 * Generate Jira issues from specification text.
 * @param {string} specText - Raw specification text
 * @param {{ forceError?: boolean }} [options]
 * @returns {Promise<{ issues: import('./mockApi.js').Issue[] }>}
 */
export async function generateIssues(specText, options = {}) {
  return mockApi.generateIssues(specText, options);
}

/**
 * Publish issues to Jira.
 * @param {import('./mockApi.js').Issue[]} issues - Issues to publish
 * @param {{ forceError?: boolean }} [options]
 * @returns {Promise<{ publishedCount: number, projectKey: string }>}
 */
export async function publishIssues(issues, options = {}) {
  return mockApi.publishIssues(issues, options);
}

export { readSpecFromFile } from './mockApi.js';
