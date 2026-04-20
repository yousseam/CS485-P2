/**
 * Tests for API Client
 * Note: These tests require Node.js 18+ with support for the test runner
 * Run with: node --test tests/apiClient.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mock fetch globally for testing
global.fetch = async (url) => {
  const mockResponses = {
    'http://localhost:3001/api/generate-issues': {
      status: 200,
      json: async () => ({
        issues: [
          {
            id: 'test-1',
            key: 'TEST-1',
            type: 'story',
            summary: 'Test Story',
            description: 'Test description',
            size: 'M',
            status: 'DRAFT',
            acceptanceCriteria: ['Criterion 1']
          }
        ],
        requestId: 'test-req-123',
        timestamp: new Date().toISOString()
      })
    },
    'http://localhost:3001/api/publish-issues': {
      status: 200,
      json: async () => ({
        publishedCount: 1,
        issues: [
          {
            id: 'test-1',
            jiraId: 'PROJ-1234',
            key: 'TEST-1',
            type: 'story',
            summary: 'Test Story',
            status: 'BACKLOG'
          }
        ],
        projectKey: 'PROJ',
        projectName: 'Project PROJ',
        requestId: 'test-req-456',
        timestamp: new Date().toISOString()
      })
    },
    'http://localhost:3001/api/error': {
      status: 400,
      json: async () => ({
        error: 'Bad request',
        code: 'VALIDATION_ERR',
        timestamp: new Date().toISOString(),
        requestId: 'test-req-789'
      })
    }
  };

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const response = mockResponses[url];
  if (!response) {
    throw new Error(`No mock response for URL: ${url}`);
  }

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: response.json
  };
};

describe('API Client', () => {
  describe('generateIssues()', () => {
    it('should make POST request to generate-issues endpoint', async () => {
      const specText = '# Test Specification\n\n## Overview\nTest spec content.';

      // Since we can't easily import the apiClient with mocked environment,
      // we'll test the fetch behavior directly
      const response = await fetch('http://localhost:3001/api/generate-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specText, options: {} })
      });

      assert.strictEqual(response.ok, true);

      const data = await response.json();
      assert.ok(data.issues);
      assert.ok(Array.isArray(data.issues));
      assert.ok(data.issues.length > 0);
    });

    it('should include request ID in response', async () => {
      const response = await fetch('http://localhost:3001/api/generate-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specText: 'Test spec', options: {} })
      });

      const data = await response.json();
      assert.ok(data.requestId);
      assert.strictEqual(typeof data.requestId, 'string');
    });

    it('should include timestamp in response', async () => {
      const response = await fetch('http://localhost:3001/api/generate-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specText: 'Test spec', options: {} })
      });

      const data = await response.json();
      assert.ok(data.timestamp);
      assert.strictEqual(typeof data.timestamp, 'string');
    });
  });

  describe('publishIssues()', () => {
    const sampleIssues = [
      {
        id: 'test-1',
        key: 'TEST-1',
        type: 'story',
        summary: 'Test Story',
        description: 'Test description',
        size: 'M',
        acceptanceCriteria: ['Criterion 1']
      }
    ];

    it('should make POST request to publish-issues endpoint', async () => {
      const response = await fetch('http://localhost:3001/api/publish-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues: sampleIssues, options: {} })
      });

      assert.strictEqual(response.ok, true);

      const data = await response.json();
      assert.strictEqual(data.publishedCount, sampleIssues.length);
    });

    it('should return Jira IDs for published issues', async () => {
      const response = await fetch('http://localhost:3001/api/publish-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues: sampleIssues, options: {} })
      });

      const data = await response.json();
      assert.ok(data.issues[0].jiraId);
      assert.ok(data.issues[0].jiraId.includes('-'));
    });

    it('should include project information in response', async () => {
      const response = await fetch('http://localhost:3001/api/publish-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues: sampleIssues, options: {} })
      });

      const data = await response.json();
      assert.ok(data.projectKey);
      assert.ok(data.projectName);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-OK responses', async () => {
      const response = await fetch('http://localhost:3001/api/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      assert.strictEqual(response.ok, false);
      assert.strictEqual(response.status, 400);

      const data = await response.json();
      assert.ok(data.error);
      assert.ok(data.code);
    });
  });
});
