# AI Integration - Quick Start

## Current Status: ✅ READY TO USE

Your backend is **already configured** to use AI! You just need to add an API key to your `.env` file.

## What's Already Implemented

Your backend has complete AI integration in `src/services/aiService.js`:

### ✅ Supported AI Providers
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4-turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus

### ✅ Smart Features
- Automatic provider selection (prefers OpenAI if both configured)
- Retry logic with exponential backoff (up to 3 retries)
- JSON response parsing with validation
- Error handling for rate limits and invalid keys
- Fallback to mock data if AI unavailable

### ✅ No Additional Dependencies Needed
Uses native `fetch` API - no SDK packages required!

## What You Need to Do (5 Minutes)

### 1. Get an API Key (2 minutes)

**Option A: OpenAI (Recommended)**
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Click "API Keys" → "Create new secret key"
4. Copy the key (starts with `sk-...`)

**Option B: Anthropic**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Click "API Keys" → "Create Key"
4. Copy the key (starts with `sk-ant-...`)

### 2. Configure Your Backend (2 minutes)

Edit `backend/.env`:

```bash
cd /home/tn/projects/CS485-P2/backend
nano .env
```

**For OpenAI:**
```env
# Replace this line with your actual key:
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Choose your model (gpt-4o is best value):
OPENAI_MODEL=gpt-4o
```

**For Anthropic:**
```env
# Replace this line with your actual key:
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-api-key-here

# Choose your model:
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### 3. Restart the Backend (10 seconds)

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

### 4. Test It (30 seconds)

**Option A: Through the Web UI**
1. Open http://localhost:5173
2. Upload a specification document
3. Click "Generate Issues"
4. Check the response for `"usedAI": true`

**Option B: Through API**
```bash
# First, register/login to get a token
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123"
  }'

# Then upload a document (replace YOUR_ACCESS_TOKEN and YOUR_PROJECT_ID)
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "file_name": "test-spec.txt",
    "file_type": "txt",
    "raw_text": "# User Authentication System\n\nImplement secure login with JWT tokens, password reset, and session management.",
    "options": {
      "useAI": "true"
    }
  }'
```

Look for `"usedAI": true` in the response!

## How to Tell if AI is Working

### ✅ AI is Working:
```json
{
  "usedAI": true,
  "aiMetadata": {
    "provider": "openai",
    "model": "gpt-4o",
    "attempts": 1
  }
}
```

### ❌ AI is Not Working (using mock):
```json
{
  "usedAI": false
}
```

### Check Backend Logs:
```
[IssueGenerator] Using AI to generate issues...
[AI] Calling OpenAI API with model: gpt-4o
[IssueGenerator] Generated AI issues: { issueCount: 4, provider: 'openai', model: 'gpt-4o' }
```

## Cost Estimation

### Per Specification (typical 500-2000 characters):

| Model | Cost per Spec | Quality | Speed |
|-------|---------------|---------|-------|
| **GPT-4o-mini** | ~$0.005-0.01 | ⭐⭐⭐⭐ | 🚀 Fast |
| **GPT-4o** | ~$0.01-0.02 | ⭐⭐⭐⭐⭐ | 🚀 Fast |
| **Claude 3.5 Sonnet** | ~$0.01-0.03 | ⭐⭐⭐⭐⭐ | 🐢 Moderate |
| **Claude 3 Opus** | ~$0.03-0.06 | ⭐⭐⭐⭐⭐ | 🐌 Slow |

**Recommendation**: Use **GPT-4o-mini** for best value - great quality, fast, and very affordable.

## Common Issues & Fixes

### Issue: "No AI provider is configured"

**Cause**: No API key in `.env`

**Fix**:
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

### Issue: "Failed to parse AI response"

**Cause**: AI returned malformed JSON

**Fix**: Happens occasionally, the retry logic handles this automatically

### Issue: "Rate limit exceeded"

**Cause**: Too many API calls in short time

**Fix**: Wait 30 seconds and retry, or use Anthropic instead

### Issue: "Invalid API key"

**Cause**: Wrong API key or expired key

**Fix**: Generate a new API key and update `.env`

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-abc123...` |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-api123...` |
| `ANTHROPIC_MODEL` | Anthropic model | `claude-3-5-sonnet-20241022` |
| `AI_PROVIDER` | Force specific provider | `auto`, `openai`, `anthropic` |

**Notes**:
- Only need **one** API key (OpenAI OR Anthropic)
- If both are set, defaults to OpenAI
- Use `AI_PROVIDER=anthropic` to force Anthropic

## Example Specification Text to Test

```
# User Authentication System

Implement a secure authentication system with the following features:

1. User registration with email verification
2. Password-based login with bcrypt hashing
3. JWT token generation for session management
4. Password reset via email link
5. Remember me functionality with extended tokens

Requirements:
- Passwords must be at least 8 characters
- JWT tokens expire after 1 hour
- Email verification is required before login
- Rate limiting on login attempts (5 attempts per 15 minutes)
```

This should generate 4-6 issues including epics and stories.

## Testing Checklist

- [ ] Get API key from OpenAI or Anthropic
- [ ] Add API key to `backend/.env`
- [ ] Restart backend server
- [ ] Register/login to get access token
- [ ] Create a project
- [ ] Upload specification document
- [ ] Verify `"usedAI": true` in response
- [ ] Check backend console logs for AI calls
- [ ] Review generated issues for quality

## Next Steps After AI is Working

1. **Adjust prompts** in `src/services/aiService.js` if needed
   - Modify `SYSTEM_PROMPT` for better results
   - Adjust `ISSUE_SIZES` guidelines
   - Change number of issues requested

2. **Monitor usage** in OpenAI/Anthropic dashboard
   - Track API costs
   - Set up usage alerts
   - Check rate limits

3. **Configure models** for your use case
   - GPT-4o-mini for cost-sensitive projects
   - GPT-4o for best quality
   - Claude 3.5 Sonnet for complex technical specs

## P5 Deployment Notes

When deploying to AWS in P5:

1. **Store API keys in AWS Secrets Manager**
2. **Set environment variables** in Lambda/EC2
3. **Configure CloudWatch** for API monitoring
4. **Set up budget alerts** to control costs
5. **Use VPC endpoints** for security

The code is already ready - just add your keys!

---

**Summary**: Your backend is ready for AI! Just add an API key to `.env`, restart the server, and start generating issues with real AI instead of mock data. 🚀
