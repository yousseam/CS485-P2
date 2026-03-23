/**
 * Tests for Jira Publisher Service
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { publishIssues, getProjectInfo } from '../src/services/jiraPublisher.js';
import { ApiError } from '../src/middleware/errorHandler.js';

describe('Jira Publisher Service', () => {
  const sampleIssues = [
    {
      id: 'story-1',
      key: 'STORY-1',
      type: 'story',
      summary: 'Test Story',
      description: 'A test story for publishing',
      size: 'M',
      acceptanceCriteria: ['Criterion 1', 'Criterion 2']
    },
    {
      id: 'story-2',
      key: 'STORY-2',
      type: 'story',
      summary: 'Another Test Story',
      description: 'Another test story for publishing',
      size: 'S',
      acceptanceCriteria: ['Criterion 1']
    }
  ];

  describe('publishIssues()', () => {
    it('should publish valid issues successfully', async () => {
      const result = await publishIssues(sampleIssues, { disableRandomErrors: true });

      assert.strictEqual(result.publishedCount, sampleIssues.length);
      assert.ok(result.issues);
      assert.ok(Array.isArray(result.issues));
      assert.strictEqual(result.issues.length, sampleIssues.length);
      assert.ok(result.projectKey);
      assert.ok(result.projectName);
    });

    it('should throw error for non-array issues', async () => {
      await assert.rejects(
        async () => await publishIssues(null, { forceError: false }),
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('array'));
          return true;
        }
      );
    });

    it('should throw error for empty issues array', async () => {
      await assert.rejects(
        async () => await publishIssues([], { forceError: false }),
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('At least one'));
          return true;
        }
      );
    });

    it('should throw error for issue missing id', async () => {
      const invalidIssues = [
        {
          key: 'STORY-1',
          type: 'story',
          summary: 'Test Story',
          description: 'A test story'
        }
      ];

      await assert.rejects(
        async () => await publishIssues(invalidIssues, { forceError: false }),
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('id'));
          return true;
        }
      );
    });

    it('should throw error for issue missing summary', async () => {
      const invalidIssues = [
        {
          id: 'story-1',
          key: 'STORY-1',
          type: 'story',
          description: 'A test story'
        }
      ];

      await assert.rejects(
        async () => await publishIssues(invalidIssues, { forceError: false }),
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('summary'));
          return true;
        }
      );
    });

    it('should throw error for issue missing description', async () => {
      const invalidIssues = [
        {
          id: 'story-1',
          key: 'STORY-1',
          type: 'story',
          summary: 'Test Story'
        }
      ];

      await assert.rejects(
        async () => await publishIssues(invalidIssues, { forceError: false }),
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('description'));
          return true;
        }
      );
    });

    it('should throw error for forceError option', async () => {
      await assert.rejects(
        async () => await publishIssues(sampleIssues, { forceError: true }),
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.statusCode, 503);
          assert.ok(err.message.includes('Failed to publish'));
          return true;
        }
      );
    });

    it('should perform dry run when dryRun option is true', async () => {
      const result = await publishIssues(sampleIssues, { dryRun: true });

      assert.strictEqual(result.publishedCount, 0);
      assert.strictEqual(result.dryRun, true);
      assert.ok(result.issues);
    });

    it('should generate unique Jira IDs for each issue', async () => {
      const result = await publishIssues(sampleIssues, { disableRandomErrors: true });

      const jiraIds = result.issues.map(i => i.jiraId);
      const uniqueIds = new Set(jiraIds);

      assert.strictEqual(uniqueIds.size, jiraIds.length);
    });

    it('should include project key in Jira IDs', async () => {
      const result = await publishIssues(sampleIssues, { disableRandomErrors: true });

      result.issues.forEach(issue => {
        assert.ok(issue.jiraId.startsWith(result.projectKey));
      });
    });

    it('should process publishing with reasonable delay', async () => {
      const start = Date.now();
      await publishIssues(sampleIssues, { disableRandomErrors: true });
      const duration = Date.now() - start;

      // Should take 1-2 seconds (simulated network delay)
      assert.ok(duration >= 900);
      assert.ok(duration < 3000);
    });

    it('should handle large batch of issues', async () => {
      const largeBatch = Array.from({ length: 50 }, (_, i) => ({
        id: `story-${i}`,
        key: `STORY-${i}`,
        type: 'story',
        summary: `Story ${i}`,
        description: `Description for story ${i}`,
        size: 'M',
        acceptanceCriteria: [`Criterion ${i}`]
      }));

      const result = await publishIssues(largeBatch, { forceError: false });

      assert.strictEqual(result.publishedCount, largeBatch.length);
      assert.strictEqual(result.issues.length, largeBatch.length);
    });
  });

  describe('getProjectInfo()', () => {
    it('should return project information', () => {
      const info = getProjectInfo();

      assert.ok(info.key);
      assert.ok(info.name);
      assert.ok(info.id);
      assert.ok(typeof info.configured === 'boolean');
    });

    it('should return default project key when not configured', () => {
      const info = getProjectInfo();

      assert.ok(info.key);
      assert.ok(info.key.length > 0);
    });
  });
});
