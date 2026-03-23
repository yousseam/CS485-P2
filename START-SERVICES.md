# How to Start Services

## Backend Service

### Option 1: Development Mode (Recommended)

```bash
cd /home/tn/projects/CS485-P2/backend
npm run dev
```

This will:
- Start the backend server
- Watch for file changes and auto-restart
- Connect to PostgreSQL (using your .env configuration)
- Display startup banner with database status

You should see:
```
╔═══════════════════════════════════════════════════════╗
║   AI Specification Breakdown API                      ║
╠═══════════════════════════════════════════════════════╣
║   Environment: development                    ║
║   Port: 3001                                      ║
║   URL: http://localhost:3001                   ║
║   Database: ✓ Connected                              ║
╚═══════════════════════════════════════════════════════╝
```

### Option 2: Production Mode

```bash
cd /home/tn/projects/CS485-P2/backend
npm start
```

Same as above, but without auto-restart.

### Verify Backend is Running

```bash
# Health check
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

---

## Frontend Service

### Start Frontend

```bash
cd /home/tn/projects/CS485-P2/frontend
npm run dev
```

This will start the Vite development server, typically on port 5173.

You should see:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

## Full Application (Both Services)

You need **two terminal windows** to run both services:

### Terminal 1: Backend

```bash
cd /home/tn/projects/CS485-P2/backend
npm run dev
```

### Terminal 2: Frontend

```bash
cd /home/tn/projects/CS485-P2/frontend
npm run dev
```

Then open your browser to: http://localhost:5173

---

## Troubleshooting

### Backend Won't Start

**Error**: `Failed to connect to database`

**Fix**:
1. Check if PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Verify database exists:
   ```bash
   psql -l | grep ai_spec_breakdown
   ```

3. Check database credentials in `.env`:
   ```bash
   cat .env | grep DB_
   ```

**Error**: `EADDRINUSE: address already in use :::3001`

**Fix**:
```bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill -9
# Or use different port in .env:
PORT=3002 npm start
```

### Frontend Won't Start

**Error**: `VITE is already running`

**Fix**:
```bash
# Kill existing Vite process
lsof -ti:5173 | xargs kill -9
# Then restart
npm run dev
```

**Error**: `Cannot connect to backend`

**Fix**: Make sure backend is running first, then start frontend.

---

## Verify AI Integration is Working

### 1. Start Backend (Terminal 1)
```bash
cd /home/tn/projects/CS485-P2/backend
npm run dev
```

### 2. Start Frontend (Terminal 2)
```bash
cd /home/tn/projects/CS485-P2/frontend
npm run dev
```

### 3. Test in Browser

1. Go to http://localhost:5173
2. Upload a specification file
3. Click "Generate Issues"
4. Check the browser console for API responses
5. Check the backend terminal for AI logs

### Expected Backend Logs with AI

```
[IssueGenerator] Using AI to generate issues...
[AI] Calling OpenAI API with model: gpt-4o
[IssueGenerator] Generated AI issues: {
  issueCount: 4,
  provider: 'openai',
  model: 'gpt-4o',
  attempts: 1
}
```

### Expected Browser Response

```json
{
  "document": { "id": "...", "status": "Completed", ... },
  "batch": { "id": "...", "status": "DRAFT", ... },
  "issues": [
    { "id": "...", "title": "...", "status": "DRAFT", ... }
  ],
  "usedAI": true,
  "aiMetadata": {
    "provider": "openai",
    "model": "gpt-4o",
    "attempts": 1
  }
}
```

---

## API Testing with Curl

### 1. Register User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

Save the `accessToken` from the response!

### 2. Create Project

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test Project",
    "description": "Testing AI integration"
  }'
```

Save the `project_id` from the response!

### 3. Upload Spec & Generate with AI

```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "file_name": "test-spec.txt",
    "file_type": "txt",
    "raw_text": "# User Authentication System\n\nImplement secure login with JWT tokens, password hashing, and session management.",
    "options": {
      "useAI": "true"
    }
  }'
```

Look for `"usedAI": true` in the response!

---

## Environment Variables Reference

Your `.env` file should look like this (with your actual API key):

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

# AI Configuration - YOUR KEY IS HERE!
OPENAI_API_KEY=AIzaSyDfIHhqPh1XI43n0otVaFFc6beRjSt1JFU
OPENAI_MODEL=gpt-4o

# AI Provider Selection (optional)
AI_PROVIDER=auto

# Jira Configuration (for future real Jira integration)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT_KEY=ABC
```

---

## Quick Commands Reference

```bash
# Start backend (development - auto-restart)
cd backend && npm run dev

# Start backend (production - no auto-restart)
cd backend && npm start

# Start frontend
cd frontend && npm run dev

# Check backend health
curl http://localhost:3001/api/health

# Run backend tests
cd backend && npm test

# Run structure verification tests
cd backend && node --test tests/structure-verification.test.js

# View backend logs
# (Check the terminal where you ran npm run dev)
```

---

## Startup Checklist

- [ ] PostgreSQL is running
- [ ] Database `ai_spec_breakdown` exists
- [ ] Backend `.env` is configured with API key
- [ ] Backend starts without errors
- [ ] Backend health check returns `"status": "healthy"`
- [ ] Frontend starts on http://localhost:5173
- [ ] Can upload specification file
- [ ] Can generate issues (check for `"usedAI": true`)
- [ ] Can review/edit generated issues
- [ ] Can publish issues

---

## Next Steps

Once both services are running:

1. **Test the full workflow**:
   - Upload a specification
   - Generate issues with AI
   - Review and edit issues
   - Approve selected issues
   - Publish to Jira

2. **Monitor AI usage**:
   - Check OpenAI dashboard: https://platform.openai.com/usage
   - Track costs (should be ~$0.01-0.02 per spec)

3. **Adjust if needed**:
   - Change model in `.env` if too expensive
   - Adjust prompt in `aiService.js` if quality is poor

---

**Ready to go!** Just open two terminals and run the commands above. 🚀
