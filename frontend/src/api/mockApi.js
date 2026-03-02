/**
 * Mock API for AI Specification Breakdown.
 * Simulates backend delay and failures; swap for real fetch in apiClient later.
 */

/**
 * @typedef {Object} Issue
 * @property {string} id - Unique issue id
 * @property {string} [key] - Display key (e.g. 'EPIC-1', 'STORY-2')
 * @property {string} type - Issue type (e.g. 'epic', 'story')
 * @property {string} summary - Short title/summary
 * @property {string} description - Full description
 * @property {string} size - Size label (e.g. 'S', 'M', 'L')
 * @property {string[]} acceptanceCriteria - List of acceptance criteria
 * @property {string} status - Status (e.g. 'DRAFT', 'PUBLISHED')
 */

const MOCK_ISSUES = [
  {
    id: 'epic-1',
    key: 'EPIC-1',
    type: 'epic',
    summary: 'User Authentication System Implementation',
    description: 'Comprehensive implementation of user authentication with MFA, session management, and role-based access control.',
    size: 'L',
    status: 'DRAFT',
    acceptanceCriteria: [
      'All authentication endpoints are implemented and tested',
      'Security audit completed and passed',
      'Documentation is complete and reviewed',
      'Performance benchmarks meet requirements',
    ],
  },
  {
    id: 'story-2',
    key: 'STORY-2',
    type: 'story',
    summary: 'Implement User Registration Flow',
    description: 'Create user registration with email verification, password validation, and duplicate prevention.',
    size: 'M',
    status: 'DRAFT',
    acceptanceCriteria: [
      'Email/password registration endpoint created',
      'Password strength validation implemented',
      'Email verification flow sends confirmation email',
      'Duplicate email registration is prevented',
      'Passwords are hashed using bcrypt before storage',
    ],
  },
  {
    id: 'story-3',
    key: 'STORY-3',
    type: 'story',
    summary: 'Build Login System with Session Management',
    description: 'Implement email/password login with JWT-based sessions and optional Remember Me.',
    size: 'M',
    status: 'DRAFT',
    acceptanceCriteria: [
      'Login endpoint returns JWT and sets session',
      'Remember Me extends session duration when requested',
      'Account lockout after 5 failed attempts',
      'Password reset via email flow implemented',
    ],
  },
  {
    id: 'story-4',
    key: 'STORY-4',
    type: 'story',
    summary: 'Implement Multi-Factor Authentication',
    description: 'Add TOTP-based 2FA with enrollment and verification flows.',
    size: 'M',
    status: 'DRAFT',
    acceptanceCriteria: [
      'TOTP enrollment and verification endpoints',
      '2FA required for sensitive actions when enabled',
      'Recovery codes generated and stored securely',
    ],
  },
];

const MOCK_PROJECT_KEY = 'ABC';

function randomDelay(minMs = 1000, maxMs = 2000) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((r) => setTimeout(r, ms));
}

function makeApiError(code = 'AI_PROC_ERR_429') {
  const err = new Error(code);
  err.code = code;
  err.timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  err.requestId = 'req_' + Math.random().toString(16).slice(2, 18);
  return err;
}

/**
 * Simulate generating Jira issues from a specification.
 * @param {string} specText - Raw specification text
 * @param {{ forceError?: boolean }} [options] - forceError forces failure for demo
 * @returns {Promise<{ issues: Issue[] }>}
 * @throws {Error} When generation fails (randomly or when forceError is true)
 */
export async function generateIssues(specText, options = {}) {
  const { forceError = false } = options;
  await randomDelay(1000, 2000);
  if (forceError || Math.random() < 0.1) {
    throw makeApiError('AI_PROC_ERR_429');
  }
  const issues = MOCK_ISSUES.map((issue) => ({
    ...issue,
    acceptanceCriteria: [...issue.acceptanceCriteria],
  }));
  return { issues };
}

/**
 * Simulate publishing issues to Jira.
 * @param {Issue[]} issues - Issues to publish
 * @param {{ forceError?: boolean }} [options] - forceError forces failure for demo
 * @returns {Promise<{ publishedCount: number, projectKey: string }>}
 * @throws {Error} When publish fails (randomly or when forceError is true)
 */
export async function publishIssues(issues, options = {}) {
  const { forceError = false } = options;
  await randomDelay(1000, 2000);
  if (forceError || Math.random() < 0.08) {
    throw makeApiError('PUBLISH_ERR');
  }
  return {
    publishedCount: issues.length,
    projectKey: `Project ${MOCK_PROJECT_KEY}`,
  };
}

/**
 * Parse uploaded .txt or .md file in the browser (reads as text).
 * @param {File | null} file - A .txt or .md file, or null for default spec
 * @returns {Promise<string>}
 * @throws {Error} If file is not .txt or .md
 */
export async function readSpecFromFile(file) {
  if (!file) return DEFAULT_SPEC;
  const name = (file.name || '').toLowerCase();
  if (!name.endsWith('.txt') && !name.endsWith('.md')) {
    throw new Error('Only .txt and .md files are supported. Please upload a text or Markdown specification.');
  }
  const text = await file.text();
  return text || DEFAULT_SPEC;
}

const DEFAULT_SPEC = `# Technical Specification: User Authentication System

## Overview
Implement a comprehensive user authentication system with multi-factor authentication, session management, and role-based access control.

## Core Requirements

### 1. User Registration
- Support email/password registration
- Implement email verification flow
- Validate password strength (min 8 chars, uppercase, lowercase, number, special char)
- Store hashed passwords using bcrypt
- Prevent duplicate email registrations

### 2. Login System
- Email/password authentication
- Optional "Remember Me" functionality
- Account lockout after 5 failed attempts
- Password reset via email

### 3. Session & Security
- JWT-based session management
- OAuth for Google and GitHub
- Rate limiting (max 5 attempts per 15 minutes)

## Success Criteria
- All authentication flows are secure and tested
- API response time < 200ms
`;

export { DEFAULT_SPEC };
