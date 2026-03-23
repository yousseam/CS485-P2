#!/bin/bash

# Quick Start Script for AI Specification Breakdown Application

set -e

echo "🚀 Starting AI Specification Breakdown Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a process is running on a port
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0 # Port is in use
    else
        return 1 # Port is free
}

# Check PostgreSQL
echo "${YELLOW}Checking PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    if psql -l | grep -q "ai_spec_breakdown"; then
        echo "${GREEN}✓${NC} Database 'ai_spec_breakdown' exists"
    else
        echo "${RED}✗${NC} Database 'ai_spec_breakdown' does not exist"
        echo "${YELLOW}Creating database...${NC}"
        createdb ai_spec_breakdown
        echo "${GREEN}✓${NC} Database created"
        echo "${YELLOW}Running schema...${NC}"
        psql ai_spec_breakdown < backend/src/database/schema.sql
        echo "${GREEN}✓${NC} Schema loaded"
    fi
else
    echo "${RED}✗${NC} PostgreSQL not installed or not in PATH"
    echo "${YELLOW}Please install PostgreSQL first${NC}"
    exit 1
fi

# Check if backend is already running
echo ""
echo "${YELLOW}Checking if backend is running...${NC}"
if check_port 3001; then
    echo "${YELLOW}⚠${NC} Backend is already running on port 3001"
    echo "${YELLOW}Use Ctrl+C to stop it first${NC}"
    exit 1
fi

# Start backend
echo ""
echo "${GREEN}Starting backend server...${NC}"
echo "${YELLOW}Backend will run on port 3001${NC}"
echo ""

cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "${RED}✗${NC} .env file not found"
    echo "${YELLOW}Creating from .env.example...${NC}"
    cp .env.example .env
    echo "${GREEN}✓${NC} .env created"
    echo "${YELLOW}⚠${NC} Please edit .env with your database credentials${NC}"
    echo "${YELLOW}⚠${NC} And add your OpenAI/Anthropic API key for AI features${NC}"
fi

# Start backend in background
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "${YELLOW}Waiting for backend to start...${NC}"
sleep 3

# Check if backend is still running
if ps -p $BACKEND_PID > /dev/null; then
    echo "${GREEN}✓${NC} Backend started successfully (PID: $BACKEND_PID)"
    echo "${GREEN}✓${NC} Backend URL: http://localhost:3001"
    echo ""
    echo "${YELLOW}Backend logs:${NC}"
    echo "Backend is running in background. To view logs:"
    echo "  tail -f backend/logs/server.log (if logging to file)"
    echo ""
else
    echo "${RED}✗${NC} Backend failed to start"
    echo "${YELLOW}Check backend logs above for errors${NC}"
    exit 1
fi

# Check if frontend can start
echo ""
echo "${YELLOW}Checking frontend port...${NC}"
if check_port 5173; then
    echo "${YELLOW}⚠${NC} Frontend port 5173 is already in use"
    echo "${YELLOW}Use Ctrl+C to stop it first${NC}"
else
    echo "${GREEN}✓${NC} Frontend port 5173 is available"
fi

# Check if frontend exists
if [ ! -d ../frontend ]; then
    echo "${RED}✗${NC} Frontend directory not found"
    echo "${YELLOW}Expected: ../frontend${NC}"
    exit 1
fi

# Instructions for starting frontend
echo ""
echo "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║ Backend is running!${NC}"
echo "${GREEN}╠═══════════════════════════════════════════════════════╣${NC}"
echo "${GREEN}║${NC}"
echo "${GREEN}║  To start the frontend, open a NEW terminal and run:${NC}"
echo "${GREEN}║${NC}"
echo "${GREEN}║     cd ../frontend${NC}"
echo "${GREEN}║     npm run dev${NC}"
echo "${GREEN}║${NC}"
echo "${GREEN}║  Then open your browser to:${NC}"
echo "${GREEN}║${NC}"
echo "${GREEN}║     http://localhost:5173${NC}"
echo "${GREEN}║${NC}"
echo "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

echo "${YELLOW}To stop the backend, press Ctrl+C in this terminal${NC}"
echo ""

# Keep the script running so you can stop the backend with Ctrl+C
wait $BACKEND_PID
