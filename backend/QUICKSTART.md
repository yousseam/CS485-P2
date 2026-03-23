# Backend Quick Start Guide

## Prerequisites Check

1. **Node.js 20+ installed?**
```bash
node --version  # Should be v20.0.0 or higher
```

2. **PostgreSQL installed and running?**
```bash
sudo systemctl status postgresql  # Linux
# or
brew services list postgresql    # macOS
```

## Setup Steps

### 1. Create Database

```bash
createdb ai_spec_breakdown
```

### 2. Run Database Schema

```bash
psql ai_spec_breakdown < src/database/schema.sql
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_spec_breakdown
DB_USER=postgres
DB_PASSWORD=postgres

# Authentication
JWT_SECRET=your-secret-key-change-in-production
```

### 5. Start Backend

```bash
npm start
```

You should see:
```
╔═════════════════════════════════════════════════════════╗
║   AI Specification Breakdown API                      ║
╠═════════════════════════════════════════════════════════╣
║   Environment: development                    ║
║   Port: 3001                                      ║
║   URL: http://localhost:3001                   ║
║   Database: ✓ Connected                              ║
╚═════════════════════════════════════════════════════════╝
```

## Test the Backend

### Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-22T...",
  "database": "connected",
  "uptime": 1234.567
}
```

### Register User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123",
    "role": "ProjectLead"
  }'
```

Save the `accessToken` from the response!

### Create Project

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test Project",
    "description": "Test project"
  }'
```

Save the project `id` from the response!

### Upload Document (US1)

```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "file_name": "spec.txt",
    "file_type": "txt",
    "raw_text": "# Test Specification\n\nThis is a test specification."
  }'
```

### Run Integration Tests

```bash
node --test tests/backend-integration.test.js
```

Expected output:
```
✓ Complete US1-US2 workflow test passed
✓ Concurrent query test passed (10 queries)
```

## Common Issues

### Database Connection Failed

**Error**: `Failed to connect to database`

**Fix**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -l | grep ai_spec_breakdown

# If not, create it
createdb ai_spec_breakdown
```

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3001`

**Fix**:
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port in .env
PORT=3002 npm start
```

### Module Not Found

**Error**: `Cannot find module '...'`

**Fix**:
```bash
npm install
```

## Reset Everything

```bash
# Drop and recreate database
dropdb ai_spec_breakdown
createdb ai_spec_breakdown
psql ai_spec_breakdown < src/database/schema.sql

# Restart backend
npm start
```

## Next Steps

1. Read `backend/README.md` for complete API documentation
2. Review `dev-spec-4-harmonized-backend.md` for architecture details
3. Check `P4-IMPLEMENTATION-SUMMARY.md` for implementation summary
4. Run integration tests to verify everything works
