/**
 * Jira Publisher Service
 * Handles publishing issues to Jira
 * Currently mocks the Jira API calls - can be extended for real Jira integration
 */

import { ApiError, ErrorCodes } from '../middleware/errorHandler.js';

/**
 * Mock project configuration
 */
const MOCK_PROJECT = {
  key: process.env.JIRA_PROJECT_KEY || 'ABC',
  name: 'Project ABC',
  id: 'proj_12345'
};

/**
 * Simulate network delay
 */
function simulateNetworkDelay() {
  const delay = Math.random() * 1000 + 1000; // 1-2 seconds
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Validate issues array
 */
function validateIssues(issues) {
  if (!Array.isArray(issues)) {
    throw new ApiError(
      'Issues must be provided as an array',
      ErrorCodes.INVALID_ISSUES,
      400
    );
  }

  if (issues.length === 0) {
    throw new ApiError(
      'At least one issue must be provided',
      ErrorCodes.INVALID_ISSUES,
      400
    );
  }

  // Validate each issue
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];

    if (!issue.id) {
      throw new ApiError(
        `Issue at index ${i} is missing required field: id`,
        ErrorCodes.INVALID_ISSUES,
        400
      );
    }

    if (!issue.summary) {
      throw new ApiError(
        `Issue at index ${i} is missing required field: summary`,
        ErrorCodes.INVALID_ISSUES,
        400
      );
    }

    if (!issue.description) {
      throw new ApiError(
        `Issue at index ${i} is missing required field: description`,
        ErrorCodes.INVALID_ISSUES,
        400
      );
    }
  }

  return issues;
}

/**
 * Mock Jira issue creation
 * Simulates creating an issue in Jira
 */
function mockCreateIssue(issue) {
  const jiraId = `${MOCK_PROJECT.key}-${Math.floor(Math.random() * 9000) + 1000}`;

  return {
    id: issue.id,
    jiraId,
    key: jiraId,
    type: issue.type,
    summary: issue.summary,
    description: issue.description,
    status: 'BACKLOG',
    projectKey: MOCK_PROJECT.key,
    created: new Date().toISOString(),
    // Jira would return additional fields like:
    // - creator
    // - reporter
    // - assignee (if assigned)
    // - priority
    // - components
    // - labels
    // etc.
  };
}

/**
 * Publish issues to Jira
 * Currently mocks the Jira API - can be extended to use real Jira REST API
 *
 * @param {Array} issues - Array of issues to publish
 * @param {Object} options - Publishing options
 * @returns {Promise<{ publishedCount: number, issues: Array }>} - Publish result
 */
export async function publishIssues(issues, options = {}) {
  const { forceError = false, dryRun = false, disableRandomErrors = false } = options;

  // Validate input
  const validatedIssues = validateIssues(issues);

  // Simulate random publish errors (8% chance, or forced)
  if (forceError || (!disableRandomErrors && Math.random() < 0.08)) {
    throw new ApiError(
      'Failed to publish issues to Jira. Service temporarily unavailable.',
      ErrorCodes.PUBLISH_ERR,
      503
    );
  }

  // Simulate network delay
  await simulateNetworkDelay();

  if (dryRun) {
    console.log('[JiraPublisher] Dry run - would publish issues:', {
      requestId: options.requestId,
      issueCount: validatedIssues.length,
      projectKey: MOCK_PROJECT.key
    });

    return {
      publishedCount: 0,
      issues: validatedIssues.map(issue => ({
        id: issue.id,
        summary: issue.summary,
        type: issue.type,
        status: 'DRAFT'
      })),
      dryRun: true
    };
  }

  // Publish issues (mock)
  const publishedIssues = validatedIssues.map(issue => mockCreateIssue(issue));

  console.log('[JiraPublisher] Published issues:', {
    requestId: options.requestId,
    publishedCount: publishedIssues.length,
    projectKey: MOCK_PROJECT.key,
    jiraIds: publishedIssues.map(i => i.jiraId)
  });

  return {
    publishedCount: publishedIssues.length,
    issues: publishedIssues,
    projectKey: MOCK_PROJECT.key,
    projectName: MOCK_PROJECT.name
  };
}

/**
 * Publish issues with real Jira API (placeholder for future implementation)
 *
 * This function demonstrates how real Jira integration would work.
 * To use this, you would need:
 * - Jira Cloud instance URL
 * - API token
 * - Valid project key
 */
export async function publishIssuesToJira(issues, options = {}) {
  // This is a placeholder for real Jira API integration
  // Example implementation would use fetch/axios to call:
  // POST /rest/api/3/issue

  /*
  const jiraUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

  const promises = issues.map(async (issue) => {
    const response = await fetch(`${jiraUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          project: { key: projectKey },
          summary: issue.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: issue.description }]
              }
            ]
          },
          issuetype: { name: issue.type === 'epic' ? 'Epic' : 'Story' },
          // Additional fields...
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  });

  const results = await Promise.all(promises);
  */

  // For now, use the mock implementation
  return publishIssues(issues, options);
}

/**
 * Get Jira project information
 * Returns details about the configured Jira project
 */
export function getProjectInfo() {
  return {
    key: MOCK_PROJECT.key,
    name: MOCK_PROJECT.name,
    id: MOCK_PROJECT.id,
    configured: !!(process.env.JIRA_BASE_URL && process.env.JIRA_API_TOKEN)
  };
}
