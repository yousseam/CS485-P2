import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Import routes
import { generateIssuesRouter } from './src/routes/generateIssues.js';
import { publishIssuesRouter } from './src/routes/publishIssues.js';
import { healthRouter } from './src/routes/health.js';
import { authRouter } from './src/routes/auth.js';
import { projectsRouter } from './src/routes/projects.js';
import { documentsRouter } from './src/routes/documents.js';
import { tasksRouter } from './src/routes/tasks.js';
import { calculatorRouter } from './src/routes/calculator.js';

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import { generateRequestId } from './src/middleware/errorHandler.js';

// Import database
import { testConnection, closePool } from './src/database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// CORS: allow typical dev origins (localhost vs host.docker.internal both resolve to the same Vite app)
function getCorsAllowedOrigins() {
  const fromEnv = process.env.FRONTEND_URL;
  const parsed = fromEnv
    ? fromEnv.split(',').map((s) => s.trim()).filter(Boolean)
    : ['http://localhost:5173'];
  if (NODE_ENV === 'development') {
    const devDefaults = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://host.docker.internal:5173',
    ];
    return [...new Set([...parsed, ...devDefaults])];
  }
  return parsed;
}

app.use(cors({
  origin: getCorsAllowedOrigins(),
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request ID generation
app.use((req, res, next) => {
  req.id = generateRequestId();
  next();
});

// Request logging middleware
app.use(requestLogger);

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/generate-issues', generateIssuesRouter);
app.use('/api/publish-issues', publishIssuesRouter);
app.use('/api/calculator', calculatorRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI Specification Breakdown API',
    version: '2.0.0',
    environment: NODE_ENV,
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      projects: '/api/projects',
      documents: '/api/documents',
      tasks: '/api/tasks',
      generateIssues: '/api/generate-issues',
      publishIssues: '/api/publish-issues'
    },
    documentation: 'See README.md for API details'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Please check your database configuration.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`
╔═════════════════════════════════════════════════════════╗
║   AI Specification Breakdown API                      ║
╠═════════════════════════════════════════════════════════╣
║   Environment: ${NODE_ENV.padEnd(20)}║
║   Port: ${String(PORT).padEnd(28)}║
║   URL: http://localhost:${PORT}                   ║
║   Database: ✓ Connected                              ║
╚═════════════════════════════════════════════════════════╝
  `);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closePool();
  process.exit(0);
});
export { app };
