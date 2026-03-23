/**
 * AI Integration Service
 * Provides unified interface for OpenAI and Anthropic APIs
 * Generates Jira issues from specification text using AI
 */

import { ApiError, ErrorCodes } from '../middleware/errorHandler.js';

/**
 * Issue size labels that AI should use
 */
const ISSUE_SIZES = ['S', 'M', 'L', 'XL'];

/**
 * Issue types that AI should generate
 */
const ISSUE_TYPES = ['epic', 'story'];

/**
 * System prompt for issue generation
 * Instructs the AI on how to structure output
 */
const SYSTEM_PROMPT = `You are an expert Jira issue generator and technical specification analyst. Your task is to break down technical specifications into well-structured Jira issues.

Generate issues that follow these guidelines:

1. **Issue Types**: Create epics for major features and stories for individual tasks
2. **Sizing**: Assign appropriate sizes:
   - S: Simple, well-defined task (1-2 days)
   - M: Moderate complexity (3-5 days)
   - L: Large feature or multiple sub-tasks (1-2 weeks)
   - XL: Very large, complex feature (3+ weeks)

3. **Acceptance Criteria**: Each story should have 3-5 clear, testable acceptance criteria
4. **Epics**: Include 1-2 epics for major features when appropriate
5. **Structure**: Follow the exact JSON format shown below

Generate 4-8 issues total, with a mix of epics and stories when appropriate.`;

/**
 * User prompt template for issue generation
 */
function getUserPrompt(specText) {
  return `Break down the following technical specification into Jira issues:

${specText}

Generate a JSON response following this exact structure:
{
  "issues": [
    {
      "id": "unique-id",
      "key": "ISSUE-KEY",
      "type": "epic|story",
      "summary": "Clear, concise summary",
      "description": "Detailed description of the issue",
      "size": "S|M|L|XL",
      "acceptanceCriteria": [
        "Testable criterion 1",
        "Testable criterion 2"
      ]
    }
  ]
}

Rules:
- Use snake_case for "id" field (e.g., "user_auth_system")
- Use uppercase with hyphens for "key" field (e.g., "EPIC-1", "STORY-2")
- Make summaries actionable and clear
- Descriptions should provide context and details
- Acceptance criteria must be testable and specific
- Include only issues mentioned or implied in the specification`;
}

/**
 * Retry configuration for AI API calls
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 2
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt, config) {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Parse AI response into structured format
 * Handles various response formats and validates output
 *
 * @param {string} response - Raw AI response
 * @returns {Object} Parsed and validated issues object
 * @throws {Error} If response is invalid or cannot be parsed
 */
function parseAIResponse(response) {
  let parsed;

  try {
    // Try to parse as JSON
    parsed = JSON.parse(response);
  } catch (error) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch (e) {
        throw new ApiError(
          'Failed to parse AI response. The AI returned invalid JSON.',
          ErrorCodes.AI_PROC_ERR_500,
          500
        );
      }
    } else {
      throw new ApiError(
        'Failed to parse AI response. Expected JSON format.',
        ErrorCodes.AI_PROC_ERR_500,
        500
      );
    }
  }

  // Validate parsed response
  if (!parsed || typeof parsed !== 'object') {
    throw new ApiError(
      'AI response is not a valid object.',
      ErrorCodes.AI_PROC_ERR_500,
      500
    );
  }

  if (!Array.isArray(parsed.issues)) {
    throw new ApiError(
      'AI response must contain an "issues" array.',
      ErrorCodes.AI_PROC_ERR_500,
      500
    );
  }

  if (parsed.issues.length === 0) {
    throw new ApiError(
      'AI response contains no issues. Please provide a more detailed specification.',
      ErrorCodes.AI_PROC_ERR_500,
      500
    );
  }

  // Validate each issue
  const validatedIssues = parsed.issues.map((issue, index) => {
    const errors = [];

    if (!issue.id || typeof issue.id !== 'string') {
      errors.push('id is required and must be a string');
    }

    if (!issue.key || typeof issue.key !== 'string') {
      errors.push('key is required and must be a string');
    }

    if (!issue.type || !ISSUE_TYPES.includes(issue.type)) {
      errors.push(`type must be one of: ${ISSUE_TYPES.join(', ')}`);
    }

    if (!issue.summary || typeof issue.summary !== 'string') {
      errors.push('summary is required and must be a string');
    }

    if (!issue.description || typeof issue.description !== 'string') {
      errors.push('description is required and must be a string');
    }

    if (!issue.size || !ISSUE_SIZES.includes(issue.size)) {
      errors.push(`size must be one of: ${ISSUE_SIZES.join(', ')}`);
    }

    if (!Array.isArray(issue.acceptanceCriteria) || issue.acceptanceCriteria.length === 0) {
      errors.push('acceptanceCriteria is required and must be a non-empty array');
    }

    if (errors.length > 0) {
      throw new ApiError(
        `Issue ${index + 1} validation failed: ${errors.join(', ')}`,
        ErrorCodes.AI_PROC_ERR_500,
        500
      );
    }

    return {
      id: issue.id.trim(),
      key: issue.key.trim(),
      type: issue.type,
      summary: issue.summary.trim(),
      description: issue.description.trim(),
      size: issue.size,
      acceptanceCriteria: issue.acceptanceCriteria.map(ac => ac.trim()),
      status: 'DRAFT'
    };
  });

  return { issues: validatedIssues };
}

/**
 * Call OpenAI API to generate issues
 *
 * @param {string} specText - Specification text
 * @param {Object} options - Options for API call
 * @returns {Promise<Object>} Generated issues
 */
async function callOpenAI(specText, options = {}) {
  const { apiKey, model = 'gpt-4o' } = options;

  if (!apiKey) {
    throw new ApiError(
      'OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.',
      ErrorCodes.AI_PROC_ERR_500,
      500
    );
  }

  const prompt = getUserPrompt(specText);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (response.status === 429) {
      throw new ApiError(
        'OpenAI rate limit exceeded. Please try again later.',
        ErrorCodes.AI_PROC_ERR_429,
        429
      );
    }

    if (response.status === 401) {
      throw new ApiError(
        'OpenAI API key is invalid. Please check your configuration.',
        ErrorCodes.AI_PROC_ERR_500,
        500
      );
    }

    throw new ApiError(
      `OpenAI API error: ${error.error?.message || response.statusText}`,
      ErrorCodes.AI_PROC_ERR_500,
      response.status
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new ApiError(
      'OpenAI returned an empty response.',
      ErrorCodes.AI_PROC_ERR_500,
      500
    );
  }

  return parseAIResponse(content);
}

/**
 * Call Anthropic API to generate issues
 *
 * @param {string} specText - Specification text
 * @param {Object} options - Options for API call
 * @returns {Promise<Object>} Generated issues
 */
async function callAnthropic(specText, options = {}) {
  const { apiKey, model = 'claude-3-sonnet-20250219' } = options;

  if (!apiKey) {
    throw new ApiError(
      'Anthropic API key is not configured. Please set ANTHROPIC_API_KEY environment variable.',
      ErrorCodes.AI_PROC_ERR_500,
      500
    );
  }

  const prompt = getUserPrompt(specText);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (response.status === 429) {
      throw new ApiError(
        'Anthropic rate limit exceeded. Please try again later.',
        ErrorCodes.AI_PROC_ERR_429,
        429
      );
    }

    if (response.status === 401) {
      throw new ApiError(
        'Anthropic API key is invalid. Please check your configuration.',
        ErrorCodes.AI_PROC_ERR_500,
        500
      );
    }

    throw new ApiError(
      `Anthropic API error: ${error.error?.message || response.statusText}`,
      ErrorCodes.AI_PROC_ERR_500,
      response.status
    );
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new ApiError(
      'Anthropic returned an empty response.',
      ErrorCodes.AI_PROC_ERR_500,
      500
    );
  }

  return parseAIResponse(content);
}

/**
 * Generate issues using AI
 * Automatically selects to best available AI provider
 *
 * @param {string} specText - Specification text to analyze
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated issues with metadata
 */
export async function generateIssuesWithAI(specText, options = {}) {
  const {
    provider = 'auto', // 'auto', 'openai', 'anthropic'
    openaiKey,
    anthropicKey,
    openaiModel = 'gpt-4o',
    anthropicModel = 'claude-3-sonnet-20250219',
    maxRetries = RETRY_CONFIG.maxRetries,
    disableRetry = false
  } = options;

  // Determine which provider to use
  let selectedProvider = provider;
  if (provider === 'auto') {
    if (openaiKey && anthropicKey) {
      // Prefer OpenAI if both are available
      selectedProvider = 'openai';
    } else if (openaiKey) {
      selectedProvider = 'openai';
    } else if (anthropicKey) {
      selectedProvider = 'anthropic';
    } else {
      throw new ApiError(
        'No AI provider is configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.',
        ErrorCodes.AI_PROC_ERR_500,
        500
      );
    }
  }

  // Call to appropriate provider with retry logic
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (selectedProvider === 'openai') {
        const result = await callOpenAI(specText, {
          apiKey: openaiKey,
          model: openaiModel
        });

        return {
          ...result,
          metadata: {
            provider: 'openai',
            model: openaiModel,
            attempts: attempt
          }
        };
      } else if (selectedProvider === 'anthropic') {
        const result = await callAnthropic(specText, {
          apiKey: anthropicKey,
          model: anthropicModel
        });

        return {
          ...result,
          metadata: {
            provider: 'anthropic',
            model: anthropicModel,
            attempts: attempt
          }
        };
      }
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error.statusCode === 401 || // Invalid API key
        error.statusCode === 400 || // Bad request
        disableRetry
      ) {
        throw error;
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        const delay = getBackoffDelay(attempt, RETRY_CONFIG);
        console.log(`[AI] Retry ${attempt}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  throw lastError;
}

/**
 * Check if AI is available (has API keys configured)
 *
 * @param {Object} options - Configuration options
 * @returns {boolean} Whether AI is available
 */
export function isAIAvailable(options = {}) {
  const { openaiKey, anthropicKey, provider = 'auto' } = options;

  if (provider === 'auto') {
    return !!(openaiKey || anthropicKey);
  }

  if (provider === 'openai') {
    return !!openaiKey;
  }

  if (provider === 'anthropic') {
    return !!anthropicKey;
  }

  return false;
}
