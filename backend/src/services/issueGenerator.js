/**
 * Issue Generation Service
 * Integrates with AI APIs to generate Jira issues from specification documents
 * Falls back to mock issues when AI is not configured
 */

import { ApiError, ErrorCodes } from '../middleware/errorHandler.js';
import { generateIssuesWithAI, isAIAvailable } from './aiService.js';

/**
 * Mock issues data for fallback when AI is not configured
 * Used when no AI API keys are available or as fallback
 */
const MOCK_ISSUES = [
  {
    id: 'epic-1',
    key: 'EPIC-1',
    type: 'epic',
    summary: 'User Authentication System Implementation',
    description: 'Comprehensive implementation of user authentication with MFA, session management, and role-based access control.',
    size: 'L',
    acceptanceCriteria: [
      'All authentication endpoints are implemented and tested',
      'Security audit completed and passed',
      'Documentation is complete and reviewed',
      'Performance benchmarks meet requirements'
    ]
  },
  {
    id: 'story-2',
    key: 'STORY-2',
    type: 'story',
    summary: 'Implement User Registration Flow',
    description: 'Create user registration with email verification, password validation, and duplicate prevention.',
    size: 'M',
    acceptanceCriteria: [
      'Email/password registration endpoint created',
      'Password strength validation implemented',
      'Email verification flow sends confirmation email',
      'Duplicate email registration is prevented',
      'Passwords are hashed using bcrypt before storage'
    ]
  },
  {
    id: 'story-3',
    key: 'STORY-3',
    type: 'story',
    summary: 'Build Login System with Session Management',
    description: 'Implement email/password login with JWT-based sessions and optional Remember Me.',
    size: 'M',
    acceptanceCriteria: [
      'Login endpoint returns JWT and sets session',
      'Remember Me extends session duration when requested',
      'Account lockout after 5 failed attempts',
      'Password reset via email flow implemented'
    ]
  },
  {
    id: 'story-4',
    key: 'STORY-4',
    type: 'story',
    summary: 'Implement Multi-Factor Authentication',
    description: 'Add TOTP-based 2FA with enrollment and verification flows.',
    size: 'M',
    acceptanceCriteria: [
      'TOTP enrollment and verification endpoints',
      '2FA required for sensitive actions when enabled',
      'Recovery codes generated and stored securely'
    ]
  }
];

/**
 * Simulate AI processing delay (for mock fallback)
 */
function simulateProcessingDelay() {
  const delay = Math.random() * 1000 + 1000; // 1-2 seconds
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Validate specification text
 */
function validateSpec(specText) {
  if (!specText || typeof specText !== 'string') {
    throw new ApiError(
      'Specification text is required and must be a string',
      ErrorCodes.INVALID_SPEC,
      400
    );
  }

  if (specText.trim().length < 10) {
    throw new ApiError(
      'Specification text is too short. Please provide a more detailed specification.',
      ErrorCodes.INVALID_SPEC,
      400
    );
  }

  if (specText.length > 500000) { // 500KB limit
    throw new ApiError(
      'Specification text is too large. Maximum size is 500KB.',
      ErrorCodes.INVALID_SPEC,
      400
    );
  }

  return specText.trim();
}

/**
 * Parse specification and extract key requirements
 * In production, this would use NLP/AI to intelligently parse the document
 */
function parseSpecification(specText) {
  // Simple keyword-based analysis (can be enhanced with NLP)
  const hasAuth = /auth|login|register|session|password/i.test(specText);
  const hasDB = /database|storage|persist|save/i.test(specText);
  const hasAPI = /api|endpoint|service|rest/i.test(specText);
  const hasUI = /ui|interface|frontend|component/i.test(specText);

  return {
    topics: {
      authentication: hasAuth,
      database: hasDB,
      api: hasAPI,
      ui: hasUI
    },
    wordCount: specText.split(/\s+/).length,
    charCount: specText.length
  };
}

/**
 * Generate issues using mock data (fallback when AI is not available)
 *
 * @param {string} specText - Specification text
 * @returns {Promise<Object>} Generated issues with analysis
 */
async function generateMockIssues(specText) {
  // Simulate processing delay
  await simulateProcessingDelay();

  // Parse the specification
  const analysis = parseSpecification(specText);

  // Generate issues from mock data
  const issues = MOCK_ISSUES.map(issue => ({
    ...issue,
    status: 'DRAFT'
  }));

  console.log('[IssueGenerator] Generated mock issues:', {
    requestId: 'N/A (mock)',
    specAnalysis: analysis,
    issueCount: issues.length
  });

  return { issues, analysis, usedAI: false };
}

/**
 * Generate issues from specification
 * Uses AI when available, falls back to mock data
 *
 * @param {string} specText - The specification text to process
 * @param {Object} options - Processing options
 * @returns {Promise<{ issues: Array, analysis: Object, usedAI: boolean }>} - Generated issues
 */
export async function generateIssues(specText, options = {}) {
  const {
    forceError = false,
    disableRandomErrors = false,
    useAI = 'auto', // 'auto', 'true', 'false'
    aiProvider = 'auto',
    openaiKey,
    anthropicKey,
    openaiModel,
    anthropicModel
  } = options;

  // Validate input
  const validatedSpec = validateSpec(specText);

  // Determine if we should use AI
  let shouldUseAI = useAI === 'true';
  if (useAI === 'auto') {
    // Check if AI is available
    const aiAvailable = isAIAvailable({
      openaiKey: openaiKey || process.env.OPENAI_API_KEY,
      anthropicKey: anthropicKey || process.env.ANTHROPIC_API_KEY,
      provider: aiProvider
    });
    shouldUseAI = aiAvailable;
  }

  // Force error if requested (for testing)
  if (forceError) {
    throw new ApiError(
      'AI processing service temporarily unavailable. Please try again.',
      ErrorCodes.AI_PROC_ERR_429,
      429
    );
  }

  // Try to use AI if available
  if (shouldUseAI) {
    try {
      console.log('[IssueGenerator] Using AI to generate issues...');

      const aiResult = await generateIssuesWithAI(validatedSpec, {
        provider: aiProvider,
        openaiKey: openaiKey || process.env.OPENAI_API_KEY,
        anthropicKey: anthropicKey || process.env.ANTHROPIC_API_KEY,
        openaiModel: openaiModel || process.env.OPENAI_MODEL,
        anthropicModel: anthropicModel || process.env.ANTHROPIC_MODEL,
        disableRetry: disableRandomErrors
      });

      const analysis = parseSpecification(validatedSpec);

      console.log('[IssueGenerator] Generated AI issues:', {
        requestId: options.requestId,
        specAnalysis: analysis,
        issueCount: aiResult.issues.length,
        provider: aiResult.metadata?.provider,
        model: aiResult.metadata?.model,
        attempts: aiResult.metadata?.attempts
      });

      return {
        issues: aiResult.issues,
        analysis,
        usedAI: true,
        aiMetadata: aiResult.metadata
      };
    } catch (error) {
      // Log the error but fall back to mock
      console.warn('[IssueGenerator] AI generation failed, falling back to mock:', error.message);
      
      // Continue to mock generation below
    }
  }

  // Fall back to mock issues
  console.log('[IssueGenerator] Using mock issue generation');
  return generateMockIssues(validatedSpec);
}

/**
 * Enhanced issue generation with custom rules
 * This demonstrates how the service could be extended
 */
export async function generateIssuesWithRules(specText, rules = {}) {
  const { includeEpics = true, includeStories = true, maxSize = null, disableRandomErrors = false } = rules;

  const result = await generateIssues(specText, { disableRandomErrors });

  // Apply filtering rules
  let filteredIssues = result.issues;

  if (!includeEpics) {
    filteredIssues = filteredIssues.filter(i => i.type !== 'epic');
  }

  if (!includeStories) {
    filteredIssues = filteredIssues.filter(i => i.type !== 'story');
  }

  if (maxSize) {
    const sizeOrder = { 'S': 1, 'M': 2, 'L': 3, 'XL': 4 };
    filteredIssues = filteredIssues.filter(i => sizeOrder[i.size] <= sizeOrder[maxSize]);
  }

  return { issues: filteredIssues, usedAI: result.usedAI };
}
