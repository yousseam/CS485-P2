# Postman Testing Guide

Complete guide for testing the AI Specification Breakdown API with Postman - no AI API key required!

## Overview

The backend **automatically falls back to mock issues** when no AI API keys are configured. This means you can test the entire API functionality without:
- Paying for OpenAI or Anthropic
- Setting up API keys
- Waiting for AI API rate limits

## Quick Start

1. **Import the Collection**
   - Download `ai-spec-breakdown-api.postman_collection.json`
   - Open Postman
   - File > Import → Upload the JSON file

2. **Set Environment Variable**
   - Click on the collection name
   - Select "Variables" tab
   - Create a variable named `baseUrl`
   - Set value to: `http://localhost:3001`

3. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

## What You Can Test

### Health Checks
- ✅ **API Health**: Verify the main API is running
- ✅ **Issue Generation Health**: Check the issue generation service
- ✅ **Publish Issues Health**: Check the publish issues service

### Issue Generation
- ✅ **Mock Generation** (No AI key needed)
  - Valid specification → Returns 4 mock issues
  - Empty specification → Returns validation error
  - Short specification → Returns validation error
  - Large specification → Returns validation error

- ✅ **Error Handling Demo**
  - Force AI error → Shows 429 rate limit error
  - Empty spec → Shows 400 validation error
  - Short spec → Shows 400 validation error
  - Large spec → Shows 400 validation error

### Issue Publishing
- ✅ **Mock Publishing** (No AI key needed)
  - Valid issues → Returns published issues with Jira IDs
  - No issues → Returns validation error

- ✅ **Error Handling Demo**
  - Force publish error → Shows 503 service error
  - No issues → Returns validation error
  - Invalid issue data → Multiple validation scenarios

### Project Info
- ✅ Get Jira project information

## Request 1: Generate Issues (Mock)

**Purpose**: Demonstrate normal issue generation without AI

**Request**:
```json
{
  "specText": "# User Authentication System\n\n## Core Requirements\n\n### 1. User Registration\n- Support email/password registration\n- Implement email verification flow",
  "options": {
    "disableRandomErrors": true
  }
}
```

**Expected Response**:
```json
{
  "issues": [
    {
      "id": "epic-1",
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
    "wordCount": 20,
    "charCount": 142
  },
  "usedAI": false
}
```

**Response Time**: ~1-2 seconds (simulated processing delay)

---

## Request 2: Force AI Error (Demo)

**Purpose**: Demonstrate error handling for AI service issues

**Request**:
```json
{
  "specText": "Any valid specification text",
  "options": {
    "forceError": true,
    "disableRandomErrors": true
  }
}
```

**Expected Response**:
```json
{
  "error": "AI processing service temporarily unavailable. Please try again.",
  "code": "AI_PROC_ERR_429",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "requestId": "req_xxxxxx"
}
```

**HTTP Status**: 429 Too Many Requests

---

## Request 3: Empty Spec (Validation Error)

**Purpose**: Test specification validation

**Request**:
```json
{
  "specText": "",
  "options": {
    "disableRandomErrors": true
  }
}
```

**Expected Response**:
```json
{
  "error": "Specification text is required and must be a string",
  "code": "INVALID_SPEC",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "requestId": "req_xxxxxx"
}
```

**HTTP Status**: 400 Bad Request

---

## Request 4: Short Spec (Validation Error)

**Purpose**: Test minimum length validation

**Request**:
```json
{
  "specText": "abc",
  "options": {
    "disableRandomErrors": true
  }
}
```

**Expected Response**:
```json
{
  "error": "Specification text is too short. Please provide a more detailed specification.",
  "code": "INVALID_SPEC",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "requestId": "req_xxxxxx"
}
```

---

## Request 5: Large Spec (Validation Error)

**Purpose**: Test maximum size validation

**Request**:
```json
{
  "specText": "A".repeat(500001),
  "options": {
    "disableRandomErrors": true
  }
}
```

**Expected Response**:
```json
{
  "error": "Specification text is too large. Maximum size is 500KB.",
  "code": "INVALID_SPEC",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "requestId": "req_xxxxxx"
}
```

**HTTP Status**: 400 Bad Request

---

## Request 6: Publish Issues (Mock Success)

**Purpose**: Test successful issue publishing

**Request**:
```json
{
  "issues": [
    {
      "id": "story-1",
      "key": "STORY-1",
      "type": "story",
      "summary": "Test Story for Demo",
      "description": "This is a test issue for Postman demo",
      "size": "M",
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2"
      ]
    }
  ],
  "options": {
    "disableRandomErrors": true
  }
}
```

**Expected Response**:
```json
{
  "publishedCount": 1,
  "issues": [
    {
      "id": "story-1",
      "jiraId": "ABC-XXXX",
      "key": "ABC-XXXX",
      "type": "story",
      "summary": "Test Story for Demo",
      "description": "This is a test issue for Postman demo",
      "status": "BACKLOG",
      "projectKey": "ABC",
      "created": "2026-03-11T12:00:00.000Z"
    }
  ],
  "projectKey": "ABC",
  "projectName": "Project ABC",
  "requestId": "req_xxxxxx",
  "timestamp": "2026-03-11T12:00:00.000Z"
}
```

**Response Time**: ~1-2 seconds (simulated network delay)

---

## Request 7: Publish Issues (Force Error)

**Purpose**: Demonstrate publish error handling

**Request**:
```json
{
  "issues": [
    {
      "id": "story-1",
      "key": "STORY-1",
      "type": "story",
      "summary": "Test Story for Demo",
      "description": "This is a test issue for Postman demo",
      "size": "M",
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2"
      ]
    }
  ],
  "options": {
    "forceError": true,
    "disableRandomErrors": true
  }
}
```

**Expected Response**:
```json
{
  "error": "Failed to publish issues to Jira. Service temporarily unavailable.",
  "code": "PUBLISH_ERR",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "requestId": "req_xxxxxx"
}
```

**HTTP Status**: 503 Service Unavailable

---

## Request 8: Publish Issues (No Issues)

**Purpose**: Test validation of empty issues array

**Request**:
```json
{
  "issues": [],
  "options": {
    "disableRandomErrors": true
  }
}
```

**Expected Response**:
```json
{
  "error": "issues must be provided as an array",
  "code": "VALIDATION_ERR",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "requestId": "req_xxxxxx"
}
```

---

## Request 9: Publish Issues (Invalid Issue)

**Purpose**: Test missing issue id field

**Request**:
```json
{
  "issues": [
    {
      "key": "STORY-1",
      "type": "story",
      "summary": "Test Story"
    }
  ],
  "options": {
    "disableRandomErrors": true
  }
}
```

**Expected Response**:
```json
{
  "error": "issues must be provided as an array",
  "code": "VALIDATION_ERR",
  "timestamp": "2026-03-11T12:00.00.000Z",
  "requestId": "req_xxxxxx"
}
```

---

## Request 10: Get Project Info

**Purpose**: Get Jira project configuration

**Request**:
```http
GET http://localhost:3001/api/publish-issues/project-info
```

**Expected Response**:
```json
{
  "key": "ABC",
  "name": "Project ABC",
  "id": "proj_12345",
  "configured": false,
  "requestId": "req_xxxxxx",
  "timestamp": "2026-03-11T12:00:00.000Z"
}
```

---

## Advanced: Testing with Real AI (Optional)

If you DO want to test with real AI API:

1. **Get an API Key**:
   - OpenAI: https://platform.openai.com/
   - Anthropic: https://console.anthropic.com/

2. **Configure the Backend**:
   ```bash
   cd backend
   nano .env
   ```

3. **Add your API key**:
   ```bash
   # For OpenAI
   OPENAI_API_KEY=sk-your-actual-key-here

   # For Anthropic
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```

4. **Restart the Server**:
   ```bash
   npm run dev
   ```

5. **Update Postman Request**:
   - Remove the `options.disableRandomErrors` parameter
   - Or set `options.useAI` to `true` (if you add this feature)

**Note**: Real AI calls will:
- Take 2-3 seconds per request
- Cost money (see pricing for each provider)
- Have rate limits (don't spam the API!)

---

## How It Works (Fallback Behavior)

The backend has intelligent fallback logic:

### No API Keys (Current Setup)
```javascript
// backend/src/services/issueGenerator.js
if (!openaiKey && !anthropicKey) {
  // No AI available → Use mock issues
  console.log('[IssueGenerator] Using mock issue generation');
  return generateMockIssues(validatedSpec);
}
```

### With API Keys
```javascript
if (useAI === 'true') {
  // Force AI usage
  const result = await generateIssuesWithAI(specText, { ... });
  return { issues: result.issues, usedAI: true };
}
```

### Automatic Fallback
```javascript
try {
  // Try to use AI
  const aiResult = await generateIssuesWithAI(specText, { ... });
  return { issues: aiResult.issues, usedAI: true };
} catch (error) {
  // AI failed → Fall back to mock
  console.warn('[IssueGenerator] AI generation failed, falling back to mock:', error.message);
  return generateMockIssues(validatedSpec);
}
```

This means:
- ✅ **No API key needed** for basic functionality
- ✅ **System works normally** with mock issues
- ✅ **Real AI works** when keys are configured
- ✅ **Graceful fallback** if AI fails (network, rate limits, etc.)

---

## Testing Checklist

Use this checklist to verify all functionality:

- [ ] **Health Check**: Request 1 - API Health
- [ ] **Health Check**: Request 15 - Issue Generation Service Health
- [ ] **Health Check**: Request 16 - Publish Issues Service Health
- [ ] **Generate Issues**: Request 2 - Valid specification returns mock issues
- [ ] **Error Handling**: Request 3 - Force AI error (429)
- [ ] **Validation**: Request 4 - Empty spec (400)
- [ ] **Validation**: Request 5 - Short spec (400)
- [ ] **Validation**: Request 6 - Large spec (400)
- [ ] **Publish Issues**: Request 7 - Valid issues publish successfully
- [ ] **Error Handling**: Request 8 - Force publish error (503)
- [ ] **Validation**: Request 9 - No issues (400)
- [ ] **Validation**: Request 10 - Missing issue id (400)
- [ ] **Validation**: Request 11 - Missing issue summary (400)
- [ ] **Validation**: Request 12 - Missing issue description (400)
- [ ] **Validation**: Request 13 - Invalid issues type (400)
- [ ] **Project Info**: Request 14 - Get project configuration

---

## Common Issues and Solutions

### Issue: "ECONNREFUSED"
**Problem**: Can't connect to `localhost:3001`

**Solutions**:
1. Make sure the server is running:
   ```bash
   cd backend
   npm run dev
   ```
2. Check if port 3001 is already in use:
   ```bash
   lsof -i :3001
   # Kill process if needed
   kill -9 <PID>
   ```

### Issue: "Cannot GET /api/health"
**Problem**: Wrong URL in Postman

**Solutions**:
1. Set `baseUrl` variable: `http://localhost:3001`
2. Use the `/api/` prefix in collection
3. Don't include `http://` in the URL field

### Issue: "Invalid JSON"
**Problem**: Raw JSON not parsed correctly

**Solutions**:
1. Use "mode: raw" in Postman body
2. Make sure proper line breaks (`\n`)
3. Escape special characters in strings
4. Test in Postman's "Preview" mode before sending

### Issue: "AI Error Even Without Key"
**Problem**: Seeing AI_PROC_ERR_429 error

**Solution**:
- This is normal! The mock has 10% random error rate
- Use `"options": { "disableRandomErrors": true}` to disable

---

## Integration Testing with Postman

After testing individual requests, create a workflow:

1. **Generate Issues** → Get list of issues
2. **Publish Issues** → Send issues to Jira (mock)
3. **Verify** → Check the response includes Jira IDs
4. **Error Cases** → Test validation and error handling
5. **Full Workflow** → From empty spec to published issues

### Example Workflow

```
Request 1: GET /api/health
          ↓
Request 2: POST /api/generate-issues (with spec)
          ↓
Request 3: POST /api/publish-issues (with generated issues)
          ↓
Request 4: GET /api/publish-issues/project-info
```

---

## Tips for Successful Demos

### 1. Start with Happy Path
Always test the success case first:
- Valid specification → Generate issues → Publish successfully

### 2. Show Error Cases Systematically
Test each error type separately:
- Empty spec (validation)
- Short spec (validation)
- Force AI error (API failure)
- Force publish error (service failure)

### 3. Use Disable Random Errors
For consistent demos:
```json
{
  "options": {
    "disableRandomErrors": true
  }
}
```

This prevents the 10% random mock error rate.

### 4. Check Response Times
- Success: ~1-2 seconds (simulated AI/processing)
- Error: Immediate
- Validation: Immediate

### 5. Verify Response Format
Check that all responses include:
- ✅ `requestId` - For tracing
- ✅ `timestamp` - For debugging
- ✅ Proper HTTP status codes
- ✅ Human-readable error messages

### 6. Document Your Findings
Take notes in Postman:
- Add notes to each request
- Use "Save Response" feature
- Describe what you tested and what you observed

---

## Performance Testing

If you want to demonstrate the app's speed:

**Test 1: Cold Start**
- Stop server
- Start server
- Immediately make health check
- Time: < 500ms expected

**Test 2: Throughput**
- Make 10 requests in parallel
- Average response time should be ~1-2 seconds

**Test 3: Large Specification**
- Send a large spec (several KB)
- Check it's validated correctly
- Should return 400 error quickly

---

## Debugging in Postman

### View Server Logs
```bash
cd backend
tail -f logs/  # Or watch server output directly
```

### Use Postman Console
- Check the "Console" tab for network errors
- Look for 4xx/5xx responses
- Verify response times

### Environment Variables
Postman automatically substitutes `{{baseUrl}}` with your configured value.

**If you want to test a different port:**
1. Create new environment: `devPort3002`
2. Set `baseUrl` to `http://localhost:3002`
3. Run server on that port: `PORT=3002 npm run dev`

---

## Export Your Tests

### Create Test Suite
1. Use Postman's "Runner" feature
2. Create a collection for automated tests
3. Add assertions for response validation
4. Run tests before demos

### Share Your Collection
1. File → Export Collection
2. Choose format (JSON recommended)
3. Share with team members
4. Document with your findings

---

## Summary

**What You Can Demonstrate:**
- ✅ Complete API functionality
- ✅ All validation rules
- ✅ All error handling paths
- ✅ Success scenarios
- ✅ Request/response tracking
- ✅ Mock AI fallback behavior
- ✅ **No API key required!**

**How It Works:**
1. **No AI Keys** → Uses mock issues (fast, reliable)
2. **With AI Keys** → Uses real AI (smart, dynamic)
3. **Fallback** → Automatically switches if AI fails

**Perfect for:**
- ✅ Demonstrations
- ✅ Presentations
- ✅ Testing without API costs
- ✅ Team onboarding
- ✅ CI/CD pipelines
- ✅ API documentation

**Note**: This demonstrates the entire application stack without needing any AI API keys!
