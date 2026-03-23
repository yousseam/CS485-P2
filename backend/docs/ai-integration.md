# AI Integration Guide

This guide explains how to configure and use AI-powered issue generation in the AI Specification Breakdown backend.

## Overview

The backend supports AI-powered issue generation using:
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4 Turbo
- **Anthropic**: Claude 3 Sonnet, Claude 3 Opus

When AI is configured, the system will intelligently analyze your specification text and generate relevant Jira issues with proper epics, stories, descriptions, and acceptance criteria.

## Configuration

### Quick Setup

1. Copy the environment example:
   ```bash
   cp .env.example .env
   ```

2. Add your API key(s) to `.env`:
   ```bash
   # For OpenAI
   OPENAI_API_KEY=sk-your-openai-api-key-here
   OPENAI_MODEL=gpt-4o  # Optional, defaults to gpt-4o

   # For Anthropic (Claude)
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   ANTHROPIC_MODEL=claude-3-sonnet-20250219  # Optional, defaults to Claude 3 Sonnet
   ```

3. Restart the backend:
   ```bash
   npm run dev
   ```

### Provider Selection

By default, the system automatically selects the best available provider (`AI_PROVIDER=auto`):
- Prefers OpenAI if both keys are configured
- Falls back to Anthropic if only Anthropic key is configured
- Uses mock issues if neither key is configured

To force a specific provider:

```bash
# Force OpenAI
AI_PROVIDER=openai

# Force Anthropic
AI_PROVIDER=anthropic
```

### Model Selection

Available models:

**OpenAI:**
- `gpt-4o` - Most capable, fastest (default)
- `gpt-4o-mini` - Fast, cost-effective
- `gpt-4-turbo` - Previous generation, still powerful

**Anthropic:**
- `claude-3-sonnet-20250219` - Balanced performance and speed (default)
- `claude-3-opus-20250219` - Highest quality, slower

## Getting API Keys

### OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to API keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Add to your `.env` file as `OPENAI_API_KEY`

### Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)
6. Add to your `.env` file as `ANTHROPIC_API_KEY`

## Usage

### How It Works

1. **Upload Specification**: Frontend sends specification text to backend
2. **AI Analysis**: Backend analyzes specification using AI
3. **Issue Generation**: AI generates structured Jira issues
4. **Response**: Issues returned with metadata (provider, model used)

### Response Format

```json
{
  "issues": [
    {
      "id": "user_auth_system",
      "key": "EPIC-1",
      "type": "epic",
      "summary": "User Authentication System Implementation",
      "description": "Comprehensive implementation of user authentication with MFA...",
      "size": "L",
      "acceptanceCriteria": [
        "All authentication endpoints are implemented and tested",
        "Security audit completed and passed"
      ],
      "status": "DRAFT"
    }
  ],
  "analysis": {
    "topics": {
      "authentication": true,
      "database": false,
      "api": false,
      "ui": false
    },
    "wordCount": 73,
    "charCount": 554
  },
  "usedAI": true,
  "aiMetadata": {
    "provider": "openai",
    "model": "gpt-4o",
    "attempts": 1
  }
}
```

### Logging

The backend logs AI-related information:

```
[IssueGenerator] Using AI to generate issues...
[IssueGenerator] Generated AI issues: {
  requestId: 'req_12345',
  specAnalysis: { topics: { authentication: true, ... } },
  issueCount: 6,
  provider: 'openai',
  model: 'gpt-4o',
  attempts: 1
}
```

## Error Handling

### Rate Limits

Both OpenAI and Anthropic have rate limits. The system:
- Automatically retries on rate limit errors (429)
- Uses exponential backoff between retries
- Logs retry attempts
- Provides clear error messages to users

### Invalid API Keys

If your API key is invalid:
- Error: "OpenAI API key is invalid. Please check your configuration."
- Status: 401
- Action: Verify your API key in `.env` file

### Network Errors

If the API is unreachable:
- Error: "OpenAI API error: Network error"
- Action: Check your internet connection
- Fallback: System falls back to mock issues automatically

### AI Service Unavailable

If AI fails for any reason:
- System automatically falls back to mock issues
- Logs warning: `[IssueGenerator] AI generation failed, falling back to mock: <error>`
- Continues to work normally with mock issues

## Testing

### Test Without Real API Keys

You can test the fallback behavior by not setting API keys:
```bash
# No OPENAI_API_KEY or ANTHROPIC_API_KEY in .env
npm run dev
```

The system will use mock issues and log:
```
[IssueGenerator] Using mock issue generation
```

### Test With Real API Keys

1. Add your API key to `.env`
2. Run the server:
   ```bash
   npm run dev
   ```
3. Test via the frontend or API:
   ```bash
   curl -X POST http://localhost:3001/api/generate-issues \
     -H "Content-Type: application/json" \
     -d '{"specText": "# Test Specification\n\nImplement a login system."}'
   ```

### Mock AI Responses

For testing without API costs, you can mock the AI service responses:

```javascript
// In tests, you can mock the AI service
import { generateIssuesWithAI } from '../src/services/aiService.js';

// Mock implementation
jest.mock('../src/services/aiService.js', () => ({
  generateIssuesWithAI: jest.fn().mockResolvedValue({
    issues: [/* mock issues */],
    metadata: { provider: 'mock', model: 'mock-model' }
  })
}));
```

## Troubleshooting

### Issues Not Relevant to Specification

**Problem**: Generated issues don't match your specification.

**Solutions**:
1. **Be More Specific**: Include more details in your specification
2. **Use Clear Structure**: Use headings (##, ###) to organize features
3. **Include Acceptance Criteria**: Describe what "done" looks like
4. **List Requirements**: Use bullet points for clear requirements

**Example Good Specification**:
```markdown
# User Authentication System

## Core Features

### 1. User Registration
- Email/password registration
- Email verification required before account activation
- Password strength: minimum 8 chars, 1 uppercase, 1 lowercase, 1 number
- Store passwords using bcrypt hashing
- Prevent duplicate email addresses

### 2. Login System
- JWT-based session management
- Remember me functionality (30 days)
- Account lockout after 5 failed attempts
- Password reset via email link

## Success Criteria
- All endpoints have unit tests with 80%+ coverage
- API response time < 200ms
- Security audit passed
```

### Slow Response Times

**Problem**: AI generation is slow.

**Solutions**:
1. **Use Faster Model**: Switch to `gpt-4o-mini` or `claude-3-sonnet-20250219`
2. **Reduce Spec Size**: Keep specifications concise
3. **Check Rate Limits**: You may be hitting rate limits

### API Costs

**Problem**: AI API usage is expensive.

**Solutions**:
1. **Use Smaller Model**: `gpt-4o-mini` is cheaper than `gpt-4o`
2. **Cache Results**: The system caches results in localStorage
3. **Review Issues**: Edit and refine issues instead of regenerating

## Best Practices

### Writing Specifications

1. **Start with Context**: Explain what you're building and why
2. **Use Clear Headings**: ## for major features, ### for sub-features
3. **Be Specific**: Instead of "Make it fast", say "API response time < 200ms"
4. **Include Requirements**: List technical constraints, dependencies, etc.
5. **Define Success**: What does "done" look like?

### Using AI-Generated Issues

1. **Review Carefully**: AI may miss edge cases or requirements
2. **Edit as Needed**: The frontend allows inline editing
3. **Add Acceptance Criteria**: Ensure each story has testable criteria
4. **Group by Epic**: Organize related stories under appropriate epics
5. **Size Appropriately**: Consider complexity when assigning sizes (S/M/L/XL)

## Security

### API Key Safety

- **Never commit `.env` files** to version control
- **Use environment variables** for API keys
- **Rotate keys regularly** (recommended every 90 days)
- **Monitor usage** in your OpenAI/Anthropic dashboards
- **Set rate limits** in your OpenAI/Anthropic accounts if needed

### Data Privacy

- Specifications are sent to AI APIs
- Review OpenAI and Anthropic privacy policies
- Consider using enterprise/regulated environments for sensitive data
- Anonymize proprietary information if needed

## API Rate Limits

### OpenAI Rate Limits (as of 2025)

- **Free Tier**: 3 requests per minute, 200 requests per day
- **Paid Tier**: Depends on plan (typically 3,000+ RPM)
- **GPT-4o**: Higher limits than GPT-4 Turbo

### Anthropic Rate Limits (as of 2025)

- **Free Tier**: 5 requests per minute
- **Paid Tier**: Depends on plan (typically unlimited for practical use)
- **Claude 3 Sonnet**: Higher limits than Claude 3 Opus

## Costs

### Estimated Costs (per 1000 specifications)

| Model | Input Cost | Output Cost | Est. Cost/1000 |
|-------|------------|--------------|-----------------|
| GPT-4o | $2.50/M tokens | $10.00/M tokens | ~$12-20 |
| GPT-4o-mini | $0.15/M tokens | $0.60/M tokens | ~$1-2 |
| Claude 3 Sonnet | $3.00/M tokens | $15.00/M tokens | ~$10-25 |
| Claude 3 Opus | $15.00/M tokens | $75.00/M tokens | ~$50-100 |

**Note**: Costs vary based on specification length and number of issues generated.

## Support

- **OpenAI Documentation**: https://platform.openai.com/docs
- **Anthropic Documentation**: https://docs.anthropic.com/
- **Issue Tracker**: https://github.com/anthropics/claude-code/issues
- **Community**: Join relevant AI/developer communities

## Future Enhancements

Planned improvements to AI integration:

- [ ] Support for more AI providers (Google Gemini, etc.)
- [ ] Streaming responses for faster generation
- [ ] Fine-tuned models for Jira issue generation
- [ ] Batch processing for multiple specifications
- [ ] Template system for different issue types
- [ ] Integration with project management tools
- [ ] Automatic issue prioritization based on dependencies
- [ ] Multi-language support for specifications
