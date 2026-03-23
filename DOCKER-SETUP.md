# Docker Setup Guide

## Overview

Using Docker to run PostgreSQL and backend simplifies everything and avoids PostgreSQL configuration issues!

## Prerequisites

- Docker
- Docker Compose

### Install on Arch Linux (your system)

```bash
sudo pacman -S docker docker-compose
```

### Verify Installation

```bash
docker --version
docker-compose --version
```

## Quick Start

### One Command Startup

```bash
./start-docker.sh
```

This will:
1. Stop any existing containers
2. Start PostgreSQL and backend
3. Wait for services to be healthy
4. Display service URLs and commands
5. Show how to view logs

## Manual Docker Commands

### Start Services

```bash
# Start PostgreSQL and backend in detached mode (background)
docker-compose up -d

# Start in foreground (see logs)
docker-compose up

# Rebuild and start (if you make code changes)
docker-compose down && docker-compose up -d --build
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop specific service
docker-compose stop postgres
docker-compose stop backend
```

### View Logs

```bash
# All logs (follow)
docker-compose logs -f

# PostgreSQL logs
docker-compose logs -f postgres

# Backend logs
docker-compose logs -f backend

# Backend logs (last 50 lines)
docker-compose logs -f backend | tail -f 50
```

### Container Status

```bash
# List running containers
docker-compose ps

# Show container details
docker-compose ps
```

## Environment Configuration

### Backend .env (for Docker)

```env
# Docker PostgreSQL connection
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ai_spec_breakdown
DB_USER=postgres
DB_PASSWORD=postgres

# AI Configuration
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_MODEL=gpt-4o

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Frontend URL (for Docker networking)
FRONTEND_URL=http://host.docker.internal:5173
```

Note: The `.env` file in `backend/` folder is used by Docker. The `docker-compose.yml` passes environment variables to the backend container.

## Docker Compose File Structure

```yaml
services:
  postgres:
    image: postgres: 15-alpine
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
    depends_on:
      postgres:
        condition: service_healthy
```

## PostgreSQL Access

### Connect to PostgreSQL from host

```bash
# Connect to PostgreSQL container
docker-compose exec postgres psql -U postgres

# Connect to PostgreSQL from host machine
docker run -it --network ai-spec-network postgres psql -h ai-spec-postgres -U postgres
```

### Database Schema

The schema is automatically loaded on first start:

- `docker-entrypoint-initdb.d/initdb-user-db.sh` runs automatically
- The script at `backend/src/database/schema.sql` needs to be run manually

### Run Database Schema

```bash
# Copy schema file to container
docker cp backend/src/database/schema.sql docker-compose exec -T postgres /tmp/schema.sql

# Apply schema to database
docker-compose exec -T postgres psql -U postgres -f /tmp/schema.sql
```

## Troubleshooting

### PostgreSQL Container Won't Start

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Backend Can't Connect to PostgreSQL

```bash
# Check backend logs
docker-compose logs backend

# Restart both services
docker-compose restart
```

### Container Keeps Restarting

```bash
# Check for resource limits
docker stats

# Check disk space
df -h

# Check memory usage
free -h
```

### Build Issues

```bash
# Rebuild backend
docker-compose up -d --build --no-cache

# Remove old volumes
docker-compose down -v
docker volume rm ai_spec_postgres_data
```

## Database Persistence

PostgreSQL data is stored in Docker volume named `ai_spec_postgres_data`. This means:

✅ Data survives container restarts
✅ Data persists even if you run `docker-compose down`
✅ Data survives `docker-compose up -d --force-recreate`
❌ Data is lost ONLY if you run `docker volume rm ai_spec_postgres_data`

To backup data:

```bash
# Dump database
docker-compose exec -T postgres pg_dump -U postgres ai_spec_breakdown > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres < backup.sql
```

## Network

Docker creates a bridge network named `ai-spec-network` that connects:
- PostgreSQL container
- Backend container

Frontend can connect via `host.docker.internal` hostname.

## Performance Tuning

### PostgreSQL Performance

PostgreSQL is already configured with:
- `shared_buffers = 128MB` (default)
- `effective_cache_size = 4GB`
- `maintenance_work_mem = 1GB`
- `checkpoint_completion_target = 0.9`

### Backend Performance

Backend is configured with:
- Express.js compression middleware
- Connection pooling (20 connections, 2 minimum)

## Access from Frontend

When backend runs in Docker, it's accessible at:
- HTTP: `http://localhost:3001`
- From frontend: `http://host.docker.internal:3001`

Update frontend `.env.development`:
```env
VITE_API_BASE_URL=http://host.docker.internal:3001/api
```

## Development Workflow

1. Make code changes
2. Rebuild and restart:
   ```bash
   docker-compose down && docker-compose up -d --build
   ```
3. Backend automatically reconnects to PostgreSQL

## Production Deployment

For production deployment, consider:

1. Use environment variables for sensitive data
   ```env
   OPENAI_API_KEY=${OPENAI_API_KEY}
   ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
   JWT_SECRET=${JWT_SECRET}
   ```

2. Use Docker Secrets Manager (AWS Secrets Manager, etc.)

3. Use Docker volumes or cloud storage for data persistence

4. Set up health checks and monitoring

## Advantages of Docker

- ✅ No PostgreSQL configuration needed
- ✅ Isolated environment (doesn't affect system)
- ✅ Easy to stop/start services
- ✅ Consistent environment across team
- ✅ Easy to scale (add `scale: 2` to run 2 backend instances)
- ✅ Easy data backup/restore with volumes
- ✅ Works on any OS with Docker

## Getting Started

```bash
# One command to start everything
./start-docker.sh

# Then open your browser
# http://localhost:5173

# Test it!
```

That's it! Docker handles all the complexity. 🐳
