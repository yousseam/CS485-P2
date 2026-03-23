/**
 * Tests for Issue Generator Service
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { generateIssues, generateIssuesWithRules } from '../src/services/issueGenerator.js';
import { ApiError } from '../src/middleware/errorHandler.js';

describe('Issue Generator Service', () => {
  const sampleSpec = `
# Technical Specification: User Authentication System

## Overview
Implement a comprehensive user authentication system with multi-factor authentication,
session management, and role-based access control.

## Core Requirements

### 1. User Registration
- Support email/password registration
- Implement email verification flow
- Validate password strength
- Store hashed passwords using bcrypt

### 2. Login System
- Email/password authentication
- Optional "Remember Me" functionality
- Account lockout after 5 failed attempts
- Password reset via email
  `;

  describe('generateIssues()', () => {
    it('should generate issues from valid specification', async () => {
      const result = await generateIssues(sampleSpec, { disableRandomErrors: true });

      assert.ok(result.issues);
      assert.ok(Array.isArray(result.issues));
      assert.strictEqual(result.issues.length > 0, true);
      assert.strictEqual(result.issues[0].status, 'DRAFT');
      assert.ok(result.issues[0].id);
      assert.ok(result.issues[0].key);
      assert.ok(result.issues[0].summary);
      assert.ok(result.issues[0].description);
      assert.ok(result.issues[0].type);
    });

    it('should throw error for empty specification', async () => {
      await assert.rejects(
        async () => await generateIssues('', { disableRandomErrors: true }),
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('required'));
          return true;
        }
      );
    });

    it('should throw error for missing specification', async () => {
      await assert.rejects(
        async () => await generateIssues(null, { disableRandomErrors: true }),
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('required'));
          return true;
        }
      );
    });

    it('should throw error for specification that is too short', async () => {
      await assert.rejects(
        async () => await generateIssues('abc', { disableRandomErrors: true }),
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('too short'));
          return true;
        }
      );
    });

    it('should throw error for forceError option', async () => {
      await assert.rejects(
        async () => await generateIssues(sampleSpec, { forceError: true, disableRandomErrors: true }),
        (err) => {
          assert.ok(err instanceof ApiError);
          assert.strictEqual(err.statusCode, 429);
          assert.ok(err.message.includes('temporarily unavailable'));
          return true;
        }
      );
    });

    it('should include analysis in result', async () => {
      const result = await generateIssues(sampleSpec, { disableRandomErrors: true });

      assert.ok(result.analysis);
      assert.ok(result.analysis.topics);
      assert.ok(typeof result.analysis.wordCount === 'number');
      assert.ok(typeof result.analysis.charCount === 'number');
    });

    it('should detect authentication-related topics', async () => {
      const authSpec = `
# Authentication Module
Implement login and registration with session management.
Users should be able to log in with email and password.
      `;

      const result = await generateIssues(authSpec, { disableRandomErrors: true });

      assert.ok(result.analysis.topics.authentication === true);
    });

    it('should process specification with reasonable delay', async () => {
      const start = Date.now();
      await generateIssues(sampleSpec, { disableRandomErrors: true });
      const duration = Date.now() - start;

      // Should take 1-2 seconds (simulated processing)
      assert.ok(duration >= 900);
      assert.ok(duration < 3000);
    });
  });

  describe('generateIssuesWithRules()', () => {
    it('should filter out epics when includeEpics is false', async () => {
      const result = await generateIssuesWithRules(sampleSpec, {
        includeEpics: false,
        includeStories: true
      });

      const hasEpic = result.issues.some(i => i.type === 'epic');
      assert.strictEqual(hasEpic, false);
    });

    it('should filter out stories when includeStories is false', async () => {
      const result = await generateIssuesWithRules(sampleSpec, {
        includeEpics: true,
        includeStories: false
      });

      const hasStory = result.issues.some(i => i.type === 'story');
      assert.strictEqual(hasStory, false);
    });

    it('should filter by size when maxSize is specified', async () => {
      const result = await generateIssuesWithRules(sampleSpec, {
        includeEpics: true,
        includeStories: true,
        maxSize: 'M'
      });

      // Should only have S and M size issues
      const hasLarge = result.issues.some(i => i.size === 'L' || i.size === 'XL');
      assert.strictEqual(hasLarge, false);
    });

    it('should include all issues when no rules are specified', async () => {
      const result = await generateIssuesWithRules(sampleSpec);

      assert.ok(result.issues.length > 0);
    });
  });
});
