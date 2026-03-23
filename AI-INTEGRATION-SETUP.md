# AI Integration Setup Guide

## Overview

Your backend is already configured to work with AI APIs! You just need to add an API key to enable real AI-powered issue generation. Currently, it falls back to mock data.

## How AI Integration Works

Your backend uses the **aiService.js** module which:
- Supports both **OpenAI** and **Anthropic** APIs
- Automatically selects the best available provider
- Includes retry logic with exponential backoff
- Validates AI responses and handles errors
- Falls back to mock data if no API key is configured

## What You Need to Do

### Step 1: Choose Your AI Provider

You have two options:

#### Option A: OpenAI (Recommended for Most Users)
- **Models**: GPT-4o, GPT-4o-mini, GPT-4-turbo
- **Cost**: ~$0.01-$0.03 per specification (depends on model)
- **Speed**: Fast
- **Quality**: Excellent for technical specs

#### Option B: Anthropic (Claude)
- **Models**: Claude 3.5 Sonnet, Claude 3 Opus
- **Cost**: ~$0.01-$0.05 per specification (depends on model)
- **Speed**: Moderate
- **Quality**: Excellent, good at following complex instructions

### Step 2: Get Your API Key

#### For OpenAI:

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy your API key (starts with `sk-...`)

#### For Anthropic:

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create Key"
5. Copy your API key (starts with `sk-ant-...`)

### Step 3: Configure Your Backend

Edit your `.env` file in the backend directory:

```bash
cd /home/tn/projects/CS485-P2/backend
nano .env
```

#### For OpenAI Only:

```env
# Remove the placeholder and paste your actual key
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Choose your model (gpt-4o is best balance of quality/cost)
OPENAI_MODEL=gpt-4o

# Keep Anthropic commented out or remove it
# ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

#### For Anthropic Only:

```env
# Remove the placeholder and paste your actual key
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-api-key-here

# Choose your model
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Keep OpenAI commented out or remove it
# OPENAI_API_KEY=sk-your-openai-api-key-here
```

#### For Both (Auto-selection):

```env
# Configure both keys - backend will prefer OpenAI
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_MODEL=gpt-4o

ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Backend will use OpenAI by default
AI_PROVIDER=auto
```

### Step 4: Restart Your Backend

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm start
```

### Step 5: Test AI Integration

You can test it through the API:

```bash
# Test with OpenAI
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "file_name": "test-spec.txt",
    "file_type": "txt",
    "raw_text": "# User Authentication System\n\nImplement login, registration, and password reset functionality with JWT tokens.",
    "options": {
      "useAI": "true",
      "aiProvider": "openai"
    }
  }'
```

## How the AI Service Works

### 1. Provider Selection

The backend automatically selects the AI provider:

```javascript
// In aiService.js
if (provider === 'auto') {
  if (openaiKey && anthropicKey) {
    selectedProvider = 'openai'; // Prefers OpenAI
  } else if (openaiKey) {
    selectedProvider = 'openai';
  } else if (anthropicKey) {
    selectedProvider = 'anthropic';
  } else {
    throw error('No AI provider configured');
  }
}
```

### 2. API Call with Retry Logic

```javascript
// Retries up to 3 times with exponential backoff
// Initial delay: 1000ms
// Max delay: 5000ms
// Multiplier: 2x each retry
```

### 3. Response Parsing

The AI service:
- Parses JSON responses from AI
- Handles markdown code blocks
- Validates the response structure
- Returns standardized issue format

### 4. Fallback to Mock Data

If:
- No API key is configured
- API call fails after retries
- AI returns invalid response

Then it falls back to the mock data in `MOCK_ISSUES` array.

## Cost Estimation

Based on typical specifications (500-2000 characters):

### OpenAI
- **GPT-4o**: ~$0.01-0.02 per spec
- **GPT-4o-mini**: ~$0.005-0.01 per spec
- **GPT-4-turbo**: ~$0.02-0.04 per spec

### Anthropic (Claude)
- **Claude 3.5 Sonnet**: ~$0.01-0.03 per spec
- **Claude 3 Opus**: ~$0.03-0.06 per spec

**Recommendation**: Use GPT-4o-mini for cost-effective, good-quality results.

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|-----------|---------|-------------|
| `OPENAI_API_KEY` | No (if Anthropic is set) | - | OpenAI API key |
| `OPENAI_MODEL` | No | gpt-4o | OpenAI model to use |
| `ANTHROPIC_API_KEY` | No (if OpenAI is set) | - | Anthropic API key |
| `ANTHROPIC_MODEL` | No | claude-3-sonnet-20250219 | Anthropic model to use |
| `AI_PROVIDER` | No | auto | 'auto', 'openai', or 'anthropic' |

## Troubleshooting

### Error: "No AI provider is configured"

**Cause**: Neither `OPENAI_API_KEY` nor `ANTHROPIC_API_KEY` is set in `.env`

**Fix**:
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

### Error: "OpenAI rate limit exceeded"

**Cause**: You've hit OpenAI's rate limits

**Fix**:
- Wait a few seconds and retry
- Use Anthropic instead
- Check your usage at https://platform.openai.com/usage

### Error: "Invalid API key"

**Cause**: API key is incorrect or expired

**Fix**:
1. Double-check your API key
2. Generate a new API key
3. Make sure there are no extra spaces in `.env`

### Error: "Failed to parse AI response"

**Cause**: AI returned malformed JSON

**Fix**:
- The retry logic handles this automatically
- Try a different model
- Simplify your specification text

## Testing AI Integration

### Method 1: Through the Frontend

1. Start the backend: `npm start`
2. Start the frontend: `cd ../frontend && npm run dev`
3. Open http://localhost:5173
4. Upload a specification document
5. Click "Generate Issues"
6. Check if `usedAI: true` in the response

### Method 2: Through the API

```bash
# 1. Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123"
  }'

# 2. Save the accessToken from response

# 3. Create a project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test Project",
    "description": "Testing AI integration"
  }'

# 4. Save the project id

# 5. Upload a spec and generate issues
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "file_name": "auth-system.txt",
    "file_type": "txt",
    "raw_text": "# Authentication System\n\nImplement user authentication with:\n- Email/password login\n- JWT token generation\n- Password reset flow\n- Session management",
    "options": {
      "useAI": "true"
    }
  }'
```

### Method 3: Check Backend Logs

When you upload a specification, check the backend console:

```
[IssueGenerator] Using AI to generate issues...
[AI] Calling OpenAI API with model: gpt-4o
[AI] Generated AI issues: { issueCount: 4, provider: 'openai', model: 'gpt-4o' }
```

If you see:
- `Using AI to generate issues...` → AI is being used
- `Using mock issue generation` → AI is NOT being used (check API key)

## Security Best Practices

1. **Never commit `.env` to git** - It contains your API keys
2. **Use `.env.example` as a template** - Only commit this file
3. **Rotate API keys regularly** - Especially for production
4. **Set usage limits** - In OpenAI/Anthropic dashboard
5. **Monitor usage** - Track API costs and set alerts

## P5 Preparation

For P5 (AWS deployment), you'll need to:
1. Set API keys in AWS Secrets Manager
2. Configure Lambda/EC2 environment variables
3. Set up AWS Budget alerts for API costs
4. Configure CloudWatch for monitoring

The backend is already ready for this - just add your keys!

## Summary

To enable AI integration:

1. ✅ Get an API key from OpenAI or Anthropic
2. ✅ Add it to `backend/.env`
3. ✅ Restart the backend
4. ✅ Test by uploading a specification

That's it! The backend handles everything else automatically.
