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

- Docker and Docker Compose
- Node.js 18 or higher (for local development/testing)
- npm

### 1. Start the Application with Docker (Recommended)

The application is configured to run with Docker Compose, which includes:
- PostgreSQL database
- Backend API server
- Automatic database initialization

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The application will be available at:
- **Frontend**: http://localhost:5173 (run separately, see below)
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5433

### 2. Start the Frontend

The frontend runs separately (not in Docker) for development:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Configure AI (Optional)

To enable real AI processing, set up your API keys:

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Add your API keys to backend/.env:
# OPENAI_API_KEY=sk-your-openai-api-key-here
# ANTHROPIC_API_KEY=your-anthropic-api-key-here
# GEMINI_API_KEY=your-gemini-api-key-here
```

For detailed AI setup, see [backend/docs/ai-integration.md](backend/docs/ai-integration.md)

## Alternative: Manual Setup (Without Docker)

If you prefer not to use Docker, you can run the application manually:

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set up PostgreSQL manually

Install PostgreSQL locally and create the database, then run the schema initialization script from `backend/src/database/schema.sql`.

### 3. Configure Environment

**Backend** (`backend/.env`):
```bash
cd backend
cp .env.example .env
# Edit .env with your database configuration
```

**Frontend** (`frontend/.env.development`):
```bash
cd frontend
cp .env.development .env.development.local
# Edit to use mock or real backend:
# VITE_USE_MOCK=false  # Use real backend
# VITE_USE_MOCK=true   # Use mock API
```

### 4. Run the Application

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

The backend uses **Jest** for unit testing (in addition to the default Node test runner)

```bash
cd backend
npm install

# Run original Node tests
npm test                # Run all tests
npm run test:watch       # Watch mode

# Run Jest unit tests (SuggestionBatch - User Story 1)
npm run test:jest

# Run Jest tests with coverage
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend
node --test tests/apiClient.test.js
```

### Integration Tests

**With Docker (recommended):**

```bash
# Start Docker services (backend + database)
docker-compose up -d

# Wait for services to be healthy (check with: docker-compose ps)
docker-compose logs -f backend

# Run integration tests
npm run test:integration:local
```

**Without Docker:**

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Run integration tests
npm run test:integration:local
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

### Docker Workflow (Recommended)

For day-to-day development, use Docker Compose:

```bash
# Start backend and database
docker-compose up -d

# The backend automatically reloads on code changes
# (due to volume mount in docker-compose.yml)

# Start frontend separately
cd frontend
npm run dev

# Make changes to backend code - Docker will pick them up
# Make changes to frontend code - Vite will hot reload

# When done, stop Docker
docker-compose down
```

### Adding New Features

1. **Backend**: Add services in `backend/src/services/`
2. **API**: Add routes in `backend/src/routes/`
3. **Frontend**: Update `frontend/src/api/apiClient.js`
4. **UI**: Update `frontend/src/App.jsx`
5. **Tests**: Add corresponding tests
6. **Docker changes**: Rebuild containers after major changes:
   ```bash
   docker-compose up -d --build
   ```

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

### Docker Deployment (Recommended)

The application uses Docker for consistent deployment across environments:

```bash
# Build and start all services
docker-compose up -d

# Rebuild services after code changes
docker-compose up -d --build

# View service logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Remove volumes (cleans database)
docker-compose down -v
```

### Docker Services

- **PostgreSQL**: Database with automatic schema initialization
- **Backend API**: Express.js server with health checks
- **Frontend**: Run separately (not containerized for development)

### Production Deployment

For production deployment, you can:

1. **Use AWS Lambda + API Gateway** (P6 - Project 6):
   - Backend is deployed as serverless functions
   - Frontend is hosted on AWS Amplify
   - Automated via GitHub Actions

2. **Docker-based deployment**:
   - Use the existing Docker Compose setup
   - Deploy to Docker Swarm, Kubernetes, or cloud hosting
   - Requires environment configuration for production

### Manual Deployment (Legacy)

If you prefer manual deployment without Docker:

**Backend**:
```bash
cd backend
npm install --production
npm start
```

**Frontend**:
```bash
cd frontend
npm install
npm run build
# Deploy the dist/ folder to your web server
```

## 📄 License

This is a CS485 course project.

## 👥 Contributors

CS485 Project 2 Team

## Deployment Notes

The application is designed to run with Docker Compose for development and production environments. The setup includes:

- **PostgreSQL database** with automatic schema initialization
- **Backend API** with health checks and automatic restarts
- **Frontend** runs separately for development (can be containerized for production)

### Current Status

✅ **Docker setup**: Complete and production-ready
✅ **Database**: PostgreSQL with automatic initialization
✅ **Health checks**: Backend API health monitoring
✅ **Volume management**: Persistent data storage
🔄 **CI/CD**: GitHub Actions configured (P6)
🔄 **AWS Deployment**: Lambda + API Gateway + Amplify (P6)

### For Production

1. Use Docker Compose for local development
2. Deploy backend to AWS Lambda + API Gateway
3. Deploy frontend to AWS Amplify
4. Enable GitHub Actions for automated deployment
5. Configure proper environment variables and secrets

### Troubleshooting

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build

# Clean everything (warning: deletes database data)
docker-compose down -v
```
## 🌐 For Web Users

To use the deployed application, simply visit:

**Frontend:** https://main.d13rhlu7k6exeo.amplifyapp.com/

1. Upload a `.txt` or `.md` specification file
2. Click **Generate** to generate Jira issues using AI
3. Review, edit, approve or reject the generated issues
4. Click **Publish** to publish the approved issues to Jira

No installation or setup required.

---

## ☁️ For Developers Forking This Repo — AWS Deployment Setup

### Prerequisites
- AWS account (free tier is sufficient)
- GitHub account with access to the forked repo
- AWS CLI installed and configured on your machine

### 1. Set Up AWS Lambda
- Go to AWS Console → Lambda → Create function
- Name it `MyAppBackend`, runtime Node.js 20, region `us-east-2`
- Upload the backend code as a zip file

### 2. Set Up AWS API Gateway
- Go to AWS Console → API Gateway → Create REST API
- Connect it to your Lambda function
- Deploy the API to a stage called `prod`

### 3. Set Up AWS Amplify
- Go to AWS Console → Amplify → New app
- Connect it to your GitHub repo's `main` branch
- Amplify will automatically build and deploy the frontend

### 4. Add GitHub Secrets
In your forked repo go to **Settings → Secrets and variables → Actions** and add:
- `AWS_ACCESS_KEY_ID` — your AWS access key ID
- `AWS_SECRET_ACCESS_KEY` — your AWS secret access key

### 5. Automated Deployment
Once secrets are added, every push to `main` will automatically:
- Deploy backend code to Lambda via `deploy-aws-lambda.yml`
- Redeploy frontend to Amplify via `deploy-aws-amplify.yml`
