/**
 * Integration Tests for API Routes
 * These tests require the server to be running
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

describe('API Integration Tests', () => {
  const sampleSpec = `
# Technical Specification: User Authentication System

## Overview
Implement a comprehensive user authentication system.

## Requirements
- User registration with email verification
- Login with session management
- Password reset functionality
  `;

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.status, 'healthy');
      assert.ok(data.timestamp);
      assert.ok(data.requestId);
    });

    it('should include uptime', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      assert.ok(typeof data.uptime === 'number');
      assert.ok(data.uptime >= 0);
    });

    it('should return environment info', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      assert.ok(data.environment);
      assert.ok(['development', 'production', 'test'].includes(data.environment));
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.name, 'AI Specification Breakdown API');
      assert.ok(data.version);
      assert.ok(data.endpoints);
    });
  });

  describe('Generate Issues Endpoint', () => {
    it('should generate issues from valid spec', async () => {
      const response = await fetch(`${BASE_URL}/api/generate-issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specText: sampleSpec })
      });

      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.ok(data.issues);
      assert.ok(Array.isArray(data.issues));
      assert.ok(data.issues.length > 0);
      assert.ok(data.requestId);
    });

    it('should return 400 for missing spec text', async () => {
      const response = await fetch(`${BASE_URL}/api/generate-issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      assert.strictEqual(response.status, 400);
    });

    it('should include request ID in response', async () => {
      const response = await fetch(`${BASE_URL}/api/generate-issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specText: sampleSpec })
      });

      const data = await response.json();

      assert.ok(data.requestId);
      assert.strictEqual(typeof data.requestId, 'string');
    });

    it('should have CORS headers', async () => {
      const response = await fetch(`${BASE_URL}/api/generate-issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specText: sampleSpec })
      });

      assert.ok(response.headers.get('access-control-allow-origin'));
    });
  });

  describe('Publish Issues Endpoint', () => {
    const sampleIssues = [
      {
        id: 'story-1',
        key: 'STORY-1',
        type: 'story',
        summary: 'Test Story',
        description: 'A test story',
        size: 'M',
        acceptanceCriteria: ['Criterion 1']
      }
    ];

    it('should publish issues successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/publish-issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues: sampleIssues })
      });

      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.publishedCount, sampleIssues.length);
      assert.ok(data.issues);
      assert.ok(data.projectKey);
    });

    it('should return 400 for missing issues', async () => {
      const response = await fetch(`${BASE_URL}/api/publish-issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      assert.strictEqual(response.status, 400);
    });

    it('should return Jira IDs for published issues', async () => {
      const response = await fetch(`${BASE_URL}/api/publish-issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues: sampleIssues })
      });

      const data = await response.json();

      assert.ok(data.issues[0].jiraId);
      assert.ok(data.issues[0].jiraId.includes('-'));
    });
  });

  describe('Service Health Endpoints', () => {
    it('should return issue generator health', async () => {
      const response = await fetch(`${BASE_URL}/api/generate-issues/health`);
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.service, 'issue-generator');
      assert.strictEqual(data.status, 'healthy');
    });

    it('should return publisher health', async () => {
      const response = await fetch(`${BASE_URL}/api/publish-issues/health`);
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.service, 'jira-publisher');
      assert.strictEqual(data.status, 'healthy');
    });

    it('should return project info', async () => {
      const response = await fetch(`${BASE_URL}/api/publish-issues/project-info`);
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.ok(data.key);
      assert.ok(data.name);
      assert.ok(data.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for invalid routes', async () => {
      const response = await fetch(`${BASE_URL}/api/nonexistent`);

      assert.strictEqual(response.status, 404);
    });

    it('should include error details in 404 response', async () => {
      const response = await fetch(`${BASE_URL}/api/nonexistent`);
      const data = await response.json();

      assert.ok(data.error);
      assert.ok(data.code);
      assert.ok(data.timestamp);
      assert.ok(data.requestId);
    });
  });
});
