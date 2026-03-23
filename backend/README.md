# AI Specification Breakdown - Backend API

Backend API for AI Specification Breakdown application. Implements both US1 (AI breakdown) and US2 (review/edit before publishing) with persistent database storage.

## Overview

This backend provides a RESTful API that:
- Handles user authentication with JWT tokens
- Manages projects and specification documents
- Generates AI-powered Jira issues from specifications (US1)
- Supports review, edit, approval, and publishing workflows (US2)
- Provides comprehensive audit logging
- Supports up to 10 concurrent users

## Architecture

### Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL with connection pooling (supports 10 concurrent users)
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: OpenAI or Anthropic (mocked for P4, ready for real integration in P5)
- **External Services**: Jira REST API (mocked for P4, ready for real integration in P5)

### Module Structure

```
backend/
├── src/
│   ├── database/
│   │   ├── connection.js      # PostgreSQL connection pool
│   │   └── schema.sql         # Database schema
│   ├── models/
│   │   ├── User.js            # User model with auth
│   │   ├── Project.js         # Project model
│   │   ├── SpecificationDocument.js  # Document model
│   │   ├── SuggestionBatch.js        # Batch model (key for US1-US2 dependency)
│   │   ├── GeneratedTask.js          # Task model with version tracking
│   │   └── AuditEvent.js            # Audit log model
│   ├── routes/
│   │   ├── auth.js            # Authentication endpoints
│   │   ├── projects.js        # Project CRUD
│   │   ├── documents.js       # Document upload and AI generation
│   │   ├── tasks.js           # Task review, edit, approve, publish
│   │   ├── generateIssues.js   # Legacy endpoint (deprecated)
│   │   ├── publishIssues.js   # Legacy endpoint (deprecated)
│   │   └── health.js          # Health check
│   ├── services/
│   │   ├── authService.js     # JWT token management
│   │   ├── issueGenerator.js  # AI issue generation
│   │   ├── aiService.js       # AI API integration
│   │   └── jiraPublisher.js   # Jira publishing (mocked)
│   └── middleware/
│       ├── auth.js            # Authentication middleware
│       ├── errorHandler.js    # Global error handling
│       └── requestLogger.js   # Request logging
├── server.js                  # Main server entry point
├── package.json
└── README.md
```

## Database Schema

### Users Table
- Stores user accounts with role-based access (ProjectLead, Developer)
- Passwords hashed with bcrypt

### Projects Table
- Project containers for specifications and tasks
- Owned by a single user

### Specification Documents Table
- Stores uploaded specification documents
- Extracted text content stored in database
- Status tracking (Processing, Completed, Failed)

### Suggestion Batches Table
- **Critical for US1-US2 dependency**: Persists AI generation sessions
- Replaces in-memory storage with stable database persistence
- Status: DRAFT, PUBLISHED, DISCARDED
- Supports idempotent publishing

### Generated Tasks Table
- AI-generated tasks that can be edited before publishing
- Version tracking for optimistic locking
- Status: DRAFT, APPROVED, REJECTED
- Jira issue IDs stored after successful publish

### Audit Events Table
- Append-only log of all changes
- Tracks: CREATE, UPDATE, APPROVE, REJECT, PUBLISH, DISCARD, DELETE
- Request ID tracing for debugging

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "ProjectLead"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ProjectLead",
    "created_at": "2026-03-22T..."
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "requestId": "req_...",
  "timestamp": "2026-03-22T..."
}
```

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:** Same as register

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

#### GET /api/auth/me
Get current user info (requires authentication).

**Headers:**
```
Authorization: Bearer <access-token>
```

### Projects

#### POST /api/projects
Create a new project (requires authentication).

**Request:**
```json
{
  "name": "My Project",
  "description": "Project description"
}
```

#### GET /api/projects
Get all projects for current user.

#### GET /api/projects/:id
Get a specific project.

#### PATCH /api/projects/:id
Update a project.

#### DELETE /api/projects/:id
Delete a project.

### Documents (US1)

#### POST /api/documents
Upload a specification document and generate AI issues (US1).

**Request:**
```json
{
  "project_id": "uuid",
  "file_name": "spec.txt",
  "file_type": "txt",
  "raw_text": "Specification text content...",
  "options": {
    "useAI": "auto",
    "aiProvider": "auto"
  }
}
```

**Response:**
```json
{
  "document": {
    "id": "uuid",
    "project_id": "uuid",
    "file_name": "spec.txt",
    "status": "Completed",
    ...
  },
  "batch": {
    "id": "uuid",
    "document_id": "uuid",
    "status": "DRAFT",
    ...
  },
  "issues": [
    {
      "id": "uuid",
      "task_type": "story",
      "title": "Implement feature",
      "description": "Description",
      "acceptance_criteria": [],
      "status": "DRAFT",
      ...
    }
  ],
  "usedAI": true,
  "requestId": "req_...",
  "timestamp": "2026-03-22T..."
}
```

#### GET /api/documents/:id
Get a specific document.

#### GET /api/documents/:id/batches
Get all suggestion batches for a document.

#### GET /api/projects/:projectId/documents
Get all documents for a project.

### Tasks (US2)

#### GET /api/tasks/batches/:batchId
Get all tasks in a batch (US2 - review workflow).

**Response:**
```json
{
  "batch": {
    "id": "uuid",
    "status": "DRAFT",
    ...
  },
  "tasks": [
    {
      "id": "uuid",
      "task_type": "story",
      "title": "Implement feature",
      "description": "Description",
      "acceptance_criteria": [],
      "status": "DRAFT",
      "version": 1,
      ...
    }
  ],
  "requestId": "req_...",
  "timestamp": "2026-03-22T..."
}
```

#### PATCH /api/tasks/:taskId
Edit a task (US2 - review/edit workflow with optimistic locking).

**Request:**
```json
{
  "version": 1,
  "title": "Updated title",
  "description": "Updated description",
  "acceptance_criteria": ["Criterion 1", "Criterion 2"],
  "size": "M"
}
```

**Response:** Updated task object

#### POST /api/tasks/:taskId/approve
Approve a task (US2 - approval workflow).

#### POST /api/tasks/:taskId/reject
Reject a task (US2 - rejection workflow).

#### POST /api/tasks/batches/:batchId/bulk-update
Bulk update tasks (approve or reject multiple tasks).

**Request:**
```json
{
  "taskIds": ["uuid1", "uuid2", "uuid3"],
  "action": "approve"
}
```

#### POST /api/tasks/batches/:batchId/validate
Validate batch before publishing (US2 - validation gate).

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "approved_count": 5,
  "draft_count": 2,
  "rejected_count": 1,
  "requestId": "req_...",
  "timestamp": "2026-03-22T..."
}
```

#### POST /api/tasks/batches/:batchId/publish
Publish approved tasks (US2 - publish workflow with idempotency).

**Request:**
```json
{
  "idempotency_key": "unique-key-123",
  "options": {
    "dryRun": false
  }
}
```

**Response:**
```json
{
  "published": true,
  "publishedCount": 5,
  "issues": [
    {
      "id": "uuid",
      "jiraId": "ABC-1234",
      "key": "ABC-1234",
      "title": "Implement feature",
      ...
    }
  ],
  "requestId": "req_...",
  "timestamp": "2026-03-22T..."
}
```

#### POST /api/tasks/batches/:batchId/discard
Discard a batch without publishing.

### Health

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-22T...",
  "database": "connected",
  "uptime": 1234.567
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `INVALID_CREDENTIALS` | Invalid email or password | 401 |
| `USER_EXISTS` | User with email already exists | 409 |
| `USER_NOT_FOUND` | User not found | 404 |
| `INVALID_INPUT` | Invalid request parameters | 400 |
| `VERSION_CONFLICT` | Concurrent modification detected | 409 |
| `INVALID_SPEC` | Invalid specification text | 400 |
| `AI_PROC_ERR_429` | AI service rate limited | 429 |
| `AI_PROC_ERR_500` | AI service error | 500 |
| `PUBLISH_ERR` | Failed to publish to Jira | 503 |
| `INVALID_ISSUES` | Invalid issues data | 400 |
| `JIRA_API_ERR` | Jira API error | 503 |
| `NOT_FOUND` | Resource not found | 404 |
| `INTERNAL_ERR` | Internal server error | 500 |

## Installation

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- npm

### Database Setup

1. Create a PostgreSQL database:
```bash
createdb ai_spec_breakdown
```

2. Run the schema:
```bash
psql ai_spec_breakdown < src/database/schema.sql
```

### Install Dependencies

```bash
cd backend
npm install
```

### Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_spec_breakdown
DB_USER=postgres
DB_PASSWORD=your-password

# Authentication
JWT_SECRET=your-secret-key-change-in-production

# AI Configuration (optional)
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=your-key

# Jira Configuration (optional, for P5)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-token
JIRA_PROJECT_KEY=ABC
```

## Running the Backend

### Development Mode

```bash
npm run dev
```

Server will watch for file changes and restart automatically.

### Production Mode

```bash
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Startup, Stop, and Reset

### Startup

```bash
cd backend
npm start
```

The server will:
1. Test database connection
2. Start Express server on configured port
3. Display startup banner with connection status

### Stop

```bash
# Press Ctrl+C in terminal
```

The server will:
1. Gracefully close HTTP server
2. Close database connection pool
3. Log shutdown message

### Reset Database

```bash
# Drop and recreate database
dropdb ai_spec_breakdown
createdb ai_spec_breakdown
psql ai_spec_breakdown < src/database/schema.sql
```

**Warning:** This will delete all data!

## Dependencies

### Required Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.2 | Web framework |
| `pg` | ^8.11.3 | PostgreSQL client |
| `dotenv` | ^16.3.1 | Environment variable loading |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `jsonwebtoken` | ^9.0.2 | JWT token generation/verification |
| `uuid` | ^9.0.1 | UUID generation |
| `cors` | ^2.8.5 | CORS middleware |
| `helmet` | ^7.1.0 | Security headers |
| `compression` | ^1.7.4 | Response compression |

### Optional Dependencies

| Package | Purpose |
|---------|---------|
| `openai` | OpenAI API integration (for real AI in P5) |
| `@anthropic-ai/sdk` | Anthropic API integration (for real AI in P5) |

## Database Management

### Connection Pool Configuration

The backend uses a connection pool configured for 10 concurrent users:

- **Max connections**: 20 (2x users for headroom)
- **Min connections**: 2
- **Idle timeout**: 30 seconds
- **Connection timeout**: 10 seconds

### Database Entities

| Table | Purpose | Relations |
|-------|---------|------------|
| `users` | User accounts | One-to-many projects |
| `projects` | Project containers | One-to-many documents |
| `specification_documents` | Uploaded specs | One-to-many batches |
| `suggestion_batches` | AI generation sessions | One-to-many tasks |
| `generated_tasks` | AI-generated tasks | Many-to-one batch |
| `jira_connections` | Jira OAuth tokens | One-to-one users |
| `audit_events` | Audit log | Standalone |

## Security

### Authentication

- JWT-based authentication with access and refresh tokens
- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Passwords hashed with bcrypt (10 rounds)

### Authorization

- Role-based access control (RBAC)
- Roles: `ProjectLead`, `Developer`
- Project ownership validation
- Task batch authorization

### Data Protection

- TLS encryption in transit (HTTPS)
- Password hashing at rest
- Environment variables for secrets
- Input validation and sanitization

## Audit Logging

All significant actions are logged to the `audit_events` table:

- User registration and login
- Project and document operations
- Task creation, updates, approvals, rejections
- Batch publishing and discarding

Audit events include:
- Entity type and ID
- Action performed
- Actor (user) ID
- Timestamp
- Diff (changes made)
- Request ID (for tracing)

## Concurrency Support

The backend supports up to 10 concurrent users through:

1. **Connection Pooling**: 20 PostgreSQL connections (2x users)
2. **Optimistic Locking**: Version tracking on tasks prevents conflicts
3. **Request Queuing**: Connection pool manages concurrent requests
4. **Idempotent Operations**: Publish operations can be safely retried

## AWS Deployment (P5)

The backend is designed for AWS deployment:

- **Compute**: EC2 or ECS
- **Database**: Amazon RDS for PostgreSQL
- **Storage**: Amazon S3 for document files
- **External Services**: OpenAI/Anthropic APIs, Jira Cloud

Migration guide will be provided in P5 documentation.

## Monitoring

### Health Check

```bash
curl http://localhost:3001/api/health
```

### Database Pool Stats

The `getPoolStats()` function returns:
- `totalCount`: Total connections in pool
- `idleCount`: Idle connections
- `waitingCount`: Requests waiting for connection

## Troubleshooting

### Database Connection Failed

Check:
1. PostgreSQL is running: `sudo systemctl status postgresql`
2. Database exists: `psql -l | grep ai_spec_breakdown`
3. Credentials in `.env` are correct
4. Network connectivity

### Token Expired

Refresh token using `/api/auth/refresh` endpoint.

### Version Conflict

If you get a 409 error on task update:
1. Refresh the task list
2. Get the latest version
3. Retry the update

## License

CS485 Course Project
