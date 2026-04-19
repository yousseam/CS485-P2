# AI Specification Breakdown

CS485 Project 2 – Full-stack application for transforming specification documents into Jira-ready issues with AI assistance.

## 📋 Overview

A full-stack application consisting of:
- **Frontend**: Single-page React app for uploading specifications, reviewing AI-generated issues, and publishing to Jira
- **Backend**: Express.js API that handles AI issue generation and Jira publishing

Implements **US1** (AI breakdown) and **US2** (review/edit before publishing).

## 🏗 Architecture

```
CS485-P2/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── api/       # API client (real backend + mock fallback)
│   │   └── App.jsx    # Main React component
│   └── tests/         # Frontend tests
├── backend/           # Express.js backend API
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   └── middleware/ # Error handling, logging
│   └── tests/         # Backend tests
├── integration-tests/ # P6: HTTP integration tests (frontend ↔ backend contract)
├── package.json       # Root scripts: npm run test:integration*
└── docs/              # Documentation
```

### Separation of Concerns

- **Frontend**: UI, state management, user interactions
- **Backend**: API endpoints, business logic, data processing
- **Clear API Boundary**: RESTful API with well-defined contracts
- **Fallback Strategy**: Frontend can use mock API if backend is unavailable

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm

### 1. Install Dependencies (Optional AI Setup)

```bash
# Install backend dependencies
cd backend
npm install


# Optional: Configure AI

```bash

cd backend

cp .env.example .env

# Add your API key to .env:

# OPENAI_API_KEY=sk-your-openai-api-key-here

# ANTHROPIC_API_KEY=your-anthropic-api-key-here

```



For detailed AI setup, see [backend/docs/ai-integration.md](backend/docs/ai-integration.md)


/
# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

**Frontend** (`frontend/.env.development`):
```bash
cd frontend
cp .env.development .env.development.local
# Edit to use mock or real backend:
# VITE_USE_MOCK=false  # Use real backend
# VITE_USE_MOCK=true   # Use mock API
```

### 3. Run the Application

**Option A: Run both services (recommended)**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Integration tests (P6 — frontend ↔ backend)

**Specification:** [docs/test-specification-frontend-backend-integration.md](docs/test-specification-frontend-backend-integration.md)

From the **repository root**, install root devDependencies once (`cross-env` for Windows-friendly env vars):

```bash
npm install
```

**Local:** start the backend first (`cd backend && npm start` or `npm run dev`), then:

```bash
npm run test:integration:local
```

**Cloud (API Gateway only, no local backend):**

```bash
npm run test:integration:cloud
```

Override the API base URL if your team deploys elsewhere:

```bash
# PowerShell
$env:INTEGRATION_API_BASE_URL="https://YOUR_ID.execute-api.REGION.amazonaws.com/prod/api"
$env:INTEGRATION_TARGET="cloud"
npm run test:integration
```

**CORS note:** These tests use **Node `fetch`**, so they do **not** reproduce browser CORS. After API Gateway CORS is fixed for Amplify, enable optional preflight checks with `RUN_CLOUD_PREFLIGHT_TESTS=true` (see spec doc § Post-CORS). True browser E2E is a future Playwright step.

**CI:** `.github/workflows/run-integration-tests.yml` runs the suite against the deployed API on every push/PR.

**Option B: Frontend only (mock API)**

```bash
cd frontend
# Set VITE_USE_MOCK=true in .env.development.local
npm run dev
```

## 📖 API Documentation

See `backend/README.md` for detailed API documentation including:
- All endpoints
- Request/response formats
- Error codes
- Authentication (when implemented)

### Quick API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/generate-issues` | POST | Generate issues from spec |
| `/api/publish-issues` | POST | Publish issues to Jira |
| `/api/publish-issues/project-info` | GET | Get project info |

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test                # Run all tests
npm run test:watch       # Watch mode
```

### Frontend Tests

```bash
cd frontend
node --test tests/apiClient.test.js
```

### Integration Tests

Integration tests require both services running:

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Run integration tests
npm test
```

## 🎯 Features

### Frontend
- 📄 Upload .txt or .md specification files
- 🤖 AI-powered issue generation
- ✏️ Review and edit generated issues
- ✅ Approve/reject issues
- 🚀 Publish to Jira
- 💾 Local storage persistence
- 📱 Responsive design (mobile + desktop)
- ♿ Accessible UI (ARIA, keyboard navigation)

### Backend
- 🔌 RESTful API
- 🔄 Mock AI processing (ready for real AI integration)
- 🔄 Mock Jira publishing (ready for real Jira API)
- 📊 Request tracking with unique IDs
- 🛡️ Comprehensive error handling
- 📝 Detailed logging
- 🏥 Health check endpoints

## 🎨 Routes / Pages

Single-page app – no routes. All flows happen on one view with different states:
- **Empty**: No spec uploaded
- **Spec Ready**: Spec uploaded, ready to generate
- **Loading**: AI processing in progress
- **Tasks**: Generated issues ready for review
- **Error**: Generation or publish error
- **Publish Success**: Issues published successfully

## 📝 Demo Loading / Error States

### Generation Error
1. Upload a file
2. Click Generate
3. During loading, click **"Simulate error path"**
4. The Generation Failed screen appears with Retry Generation

### Publish Error
1. Run the app with backend connected (`VITE_USE_MOCK=false`)
2. Generate issues
3. Publish issues
4. The backend may randomly fail (8% chance) or you can use the `forceError` option

### Mock vs Real Backend

**Mock Mode** (`VITE_USE_MOCK=true`):
- Uses `frontend/src/api/mockApi.js`
- Simulates API calls locally
- Good for UI development without backend

**Real Backend** (`VITE_USE_MOCK=false`):
- Connects to `backend` server
- Uses real HTTP requests
- Falls back to mock if backend is unavailable
- Better for integration testing

## 📐 Mockups

Figma mockup screenshots live in `/mockups` (desktop and mobile variants). See `docs/turn-in.md` for expected filenames.

## 📚 Documentation

- `backend/README.md` – Backend API documentation
- `docs/user-stories.md` – US1/US2 with acceptance criteria
- `docs/turn-in.md` – Submission template
- `docs/test-plan.md` – Screen recording checklist
- `docs/responsive-notes.md` – Breakpoints and layout
- `docs/accessibility.md` – Accessibility summary

## 🔧 Development

### Adding New Features

1. **Backend**: Add services in `backend/src/services/`
2. **API**: Add routes in `backend/src/routes/`
3. **Frontend**: Update `frontend/src/api/apiClient.js`
4. **UI**: Update `frontend/src/App.jsx`
5. **Tests**: Add corresponding tests

### Environment Variables

**Backend** (`backend/.env`):
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS
- `AI_API_KEY` - For future AI integration
- `JIRA_*` - For future Jira integration

**Frontend** (`frontend/.env.development`):
- `VITE_USE_MOCK` - Use mock API (true/false)
- `VITE_API_BASE_URL` - Backend API URL

## 🚢 Deployment

### Backend

```bash
cd backend
npm install --production
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run build
# Deploy the dist/ folder
```

## 📄 License

This is a CS485 course project.

## 👥 Contributors

CS485 Project 2 Team
