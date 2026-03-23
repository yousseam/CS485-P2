# API Documentation

Complete API documentation for the AI Specification Breakdown backend service.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently no authentication is required. Future versions will include:
- API key authentication
- JWT tokens
- Rate limiting

## Response Format

All responses follow this structure:

### Success Response

```json
{
  "data": { /* Response data */ },
  "requestId": "req_1234567890_abc123",
  "timestamp": "2026-03-11T12:00:00.000Z"
}
```

### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "requestId": "req_1234567890_abc123"
}
```

## Endpoints

### 1. Health Check

Check if the API is running and healthy.

**Endpoint:** `GET /api/health`

**Request:** No body required

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "requestId": "req_1234567890_abc123",
  "uptime": 3600.5,
  "environment": "development"
}
```

**Status Codes:**
- `200 OK` - API is healthy

---

### 2. Generate Issues

Generate Jira issues from a specification document using AI.

**Endpoint:** `POST /api/generate-issues`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "specText": "# Technical Specification\n\n## Overview\nThis spec describes...",
  "options": {
    "forceError": false
  }
}
```

**Parameters:**
- `specText` (string, required): The specification text to process
- `options` (object, optional):
  - `forceError` (boolean): Force an error for testing (default: false)

**Response (Success):**
```json
{
  "issues": [
    {
      "id": "epic-1",
      "key": "EPIC-1",
      "type": "epic",
      "summary": "User Authentication System Implementation",
      "description": "Comprehensive implementation of user authentication...",
      "size": "L",
      "status": "DRAFT",
      "acceptanceCriteria": [
        "All authentication endpoints are implemented and tested",
        "Security audit completed and passed"
      ]
    },
    {
      "id": "story-2",
      "key": "STORY-2",
      "type": "story",
      "summary": "Implement User Registration Flow",
      "description": "Create user registration with email verification...",
      "size": "M",
      "status": "DRAFT",
      "acceptanceCriteria": [
        "Email/password registration endpoint created",
        "Password strength validation implemented"
      ]
    }
  ],
  "analysis": {
    "topics": {
      "authentication": true,
      "database": false,
      "api": true,
      "ui": false
    },
    "wordCount": 150,
    "charCount": 850
  },
  "requestId": "req_1234567890_abc123",
  "timestamp": "2026-03-11T12:00:00.000Z"
}
```

**Response (Error):**
```json
{
  "error": "AI processing service temporarily unavailable. Please try again.",
  "code": "AI_PROC_ERR_429",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "requestId": "req_1234567890_abc123"
}
```

**Status Codes:**
- `200 OK` - Issues generated successfully
- `400 Bad Request` - Invalid specification
- `429 Too Many Requests` - AI service rate limited
- `500 Internal Server Error` - AI processing error

**Validation:**
- `specText` must be a string
- `specText` must be at least 10 characters
- `specText` must be less than 500KB

---

### 3. Publish Issues

Publish approved issues to Jira.

**Endpoint:** `POST /api/publish-issues`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "issues": [
    {
      "id": "epic-1",
      "key": "EPIC-1",
      "type": "epic",
      "summary": "User Authentication System Implementation",
      "description": "Comprehensive implementation of user authentication...",
      "size": "L",
      "acceptanceCriteria": [
        "All authentication endpoints are implemented and tested"
      ]
    },
    {
      "id": "story-2",
      "key": "STORY-2",
      "type": "story",
      "summary": "Implement User Registration Flow",
      "description": "Create user registration with email verification...",
      "size": "M",
      "acceptanceCriteria": [
        "Email/password registration endpoint created"
      ]
    }
  ],
  "options": {
    "forceError": false,
    "dryRun": false
  }
}
```

**Parameters:**
- `issues` (array, required): Array of issues to publish
  - `id` (string, required): Unique issue identifier
  - `key` (string, required): Issue key (e.g., "EPIC-1")
  - `type` (string, required): Issue type ("epic" or "story")
  - `summary` (string, required): Issue title/summary
  - `description` (string, required): Issue description
  - `size` (string): Issue size ("S", "M", "L", "XL")
  - `acceptanceCriteria` (array): List of acceptance criteria
- `options` (object, optional):
  - `forceError` (boolean): Force an error for testing (default: false)
  - `dryRun` (boolean): Simulate publishing without creating issues (default: false)

**Response (Success):**
```json
{
  "publishedCount": 2,
  "issues": [
    {
      "id": "epic-1",
      "jiraId": "ABC-1234",
      "key": "ABC-1234",
      "type": "epic",
      "summary": "User Authentication System Implementation",
      "description": "Comprehensive implementation of user authentication...",
      "status": "BACKLOG",
      "projectKey": "ABC",
      "created": "2026-03-11T12:00:00.000Z"
    },
    {
      "id": "story-2",
      "jiraId": "ABC-1235",
      "key": "ABC-1235",
      "type": "story",
      "summary": "Implement User Registration Flow",
      "description": "Create user registration with email verification...",
      "status": "BACKLOG",
      "projectKey": "ABC",
      "created": "2026-03-11T12:00:01.000Z"
    }
  ],
  "projectKey": "ABC",
  "projectName": "Project ABC",
  "requestId": "req_1234567890_abc123",
  "timestamp": "2026-03-11T12:00:01.000Z"
}
```

**Response (Dry Run):**
```json
{
  "publishedCount": 0,
  "issues": [
    {
      "id": "epic-1",
      "summary": "User Authentication System Implementation",
      "type": "epic",
      "status": "DRAFT"
    }
  ],
  "dryRun": true,
  "requestId": "req_1234567890_abc123",
  "timestamp": "2026-03-11T12:00:00.000Z"
}
```

**Response (Error):**
```json
{
  "error": "Failed to publish issues to Jira. Service temporarily unavailable.",
  "code": "PUBLISH_ERR",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "requestId": "req_1234567890_abc123"
}
```

**Status Codes:**
- `200 OK` - Issues published successfully
- `400 Bad Request` - Invalid issues data
- `503 Service Unavailable` - Jira service unavailable

**Validation:**
- `issues` must be an array
- `issues` must contain at least one issue
- Each issue must have: `id`, `summary`, `description`

---

### 4. Get Project Info

Get information about the configured Jira project.

**Endpoint:** `GET /api/publish-issues/project-info`

**Request:** No body required

**Response:**
```json
{
  "key": "ABC",
  "name": "Project ABC",
  "id": "proj_12345",
  "configured": false,
  "requestId": "req_1234567890_abc123",
  "timestamp": "2026-03-11T12:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Project info retrieved successfully

---

## Error Codes

| Code | Description | HTTP Status | Retryable |
|------|-------------|-------------|-----------|
| `AI_PROC_ERR_429` | AI processing rate limited | 429 | Yes |
| `AI_PROC_ERR_500` | AI processing error | 500 | Yes |
| `INVALID_SPEC` | Invalid specification | 400 | No |
| `PUBLISH_ERR` | Publish failed | 503 | Yes |
| `INVALID_ISSUES` | Invalid issues data | 400 | No |
| `JIRA_API_ERR` | Jira API error | 502 | Yes |
| `VALIDATION_ERR` | Validation error | 400 | No |
| `NOT_FOUND` | Resource not found | 404 | No |
| `INTERNAL_ERR` | Internal server error | 500 | Yes |

## Rate Limiting

Currently not implemented. Future versions will include:
- Per-IP rate limiting
- Per-user rate limiting (with authentication)
- Token bucket algorithm

## CORS

The API supports CORS for the following origins:
- `http://localhost:5173` (default frontend)

Additional origins can be configured via the `FRONTEND_URL` environment variable.

## Request Headers

All requests include:
- `X-Request-ID`: Unique request identifier for tracing
- `Content-Type`: `application/json`

## Response Headers

All responses include:
- `X-Request-ID`: Same as request ID for correlation

## SDKs

Official SDKs:
- JavaScript: `npm install ai-spec-breakdown-client` (coming soon)
- Python: `pip install ai-spec-breakdown` (coming soon)

## Examples

### cURL Examples

#### Generate Issues
```bash
curl -X POST http://localhost:3001/api/generate-issues \
  -H "Content-Type: application/json" \
  -d '{
    "specText": "# Technical Specification\n\n## Overview\nImplement authentication system.",
    "options": {
      "forceError": false
    }
  }'
```

#### Publish Issues
```bash
curl -X POST http://localhost:3001/api/publish-issues \
  -H "Content-Type: application/json" \
  -d '{
    "issues": [
      {
        "id": "story-1",
        "key": "STORY-1",
        "type": "story",
        "summary": "Test Story",
        "description": "Test description",
        "size": "M",
        "acceptanceCriteria": ["Criterion 1"]
      }
    ],
    "options": {
      "dryRun": true
    }
  }'
```

### JavaScript Examples

```javascript
// Generate Issues
async function generateIssues(specText) {
  const response = await fetch('http://localhost:3001/api/generate-issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ specText })
  });
  return response.json();
}

// Publish Issues
async function publishIssues(issues) {
  const response = await fetch('http://localhost:3001/api/publish-issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issues })
  });
  return response.json();
}
```

## Changelog

### v1.0.0 (2026-03-11)
- Initial release
- Generate Issues endpoint
- Publish Issues endpoint
- Health check endpoints
- Project info endpoint
- Mock AI and Jira integration
