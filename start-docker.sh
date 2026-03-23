#!/bin/bash

# Docker Startup Script for AI Specification Breakdown Application

set -e

echo "🐳 Starting AI Specification Breakdown with Docker..."
echo ""

# Check if Docker and Docker Compose are installed
check_docker() {
    if command -v docker &> /dev/null; then
        return 0 # Docker is installed
    else
        return 1 # Docker is not installed
    fi
}

check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        return 0 # Docker Compose is installed
    else
        return 1 # Docker Compose is not installed
    fi
}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if ! check_docker; then
    echo "${RED}✗${NC} Docker is not installed"
    echo ""
    echo "${YELLOW}Please install Docker and Docker Compose:${NC}"
    echo "  pacman -S docker docker-compose"
    echo ""
    echo "${YELLOW}On Ubuntu/Debian:${NC}"
    echo "  sudo apt-get update && sudo apt-get install -y docker.io docker-compose"
    echo ""
    echo "${YELLOW}On Arch:${NC}"
    echo "  sudo pacman -S docker docker-compose"
    echo ""
    exit 1
fi

if ! check_docker_compose; then
    echo "${RED}✗${NC} Docker Compose is not installed"
    echo ""
    echo "${YELLOW}Please install Docker Compose:${NC}"
    echo "  pacman -S docker-compose"
    echo ""
    exit 1
fi

echo "${GREEN}✓${NC} Docker is installed"
echo ""

# Stop any existing containers
echo "${YELLOW}Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true

# Start PostgreSQL and Backend services
echo "${GREEN}Starting services with Docker Compose...${NC}"
docker-compose up -d

# Wait for services to start
echo "${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Check if PostgreSQL is healthy
echo "${YELLOW}Checking PostgreSQL health...${NC}"
for i in {1..12}; do
    if docker-compose ps | grep -q "ai-spec-postgres"; then
        echo "${GREEN}✓${NC} PostgreSQL is running"
        break
    fi
    echo -n "."
    sleep 1
done

if ! docker-compose ps | grep -q "ai-spec-postgres"; then
    echo "${RED}✗${NC} PostgreSQL failed to start"
    echo "${YELLOW}Check logs:${NC}"
    docker-compose logs postgres
    exit 1
fi

# Check if Backend is healthy
echo "${YELLOW}Checking backend health...${NC}"
for i in {1..6}; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1 | grep -q "healthy"; then
        echo "${GREEN}✓${NC} Backend is healthy"
        break
    fi
    echo -n "."
    sleep 1
done

if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1 | grep -q "healthy"; then
    echo "${RED}✗${NC} Backend failed to start"
    echo "${YELLOW}Check logs:${NC}"
    docker-compose logs backend
    exit 1
fi

# Display service URLs
echo ""
echo "${GREEN}╔═════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║   Services are running!${NC}"
echo "${GREEN}╠═════════════════════════════════════════════╣${NC}"
echo "${GREEN}║${NC}"
echo "${GREEN}║   Backend:   http://localhost:3001/api       ║${NC}"
echo "${GREEN}║   Database:   ai_spec_breakdown (port 5432)      ║${NC}"
echo "${GREEN}║${NC}"
echo "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Display Docker container info
echo "${YELLOW}Container Information:${NC}"
docker-compose ps
echo ""
echo "${YELLOW}View logs:${NC}"
echo "  - PostgreSQL: ${GREEN}docker-compose logs -f postgres${NC}"
echo "  - Backend:    ${GREEN}docker-compose logs -f backend${NC}"
echo ""
echo "${YELLOW}Stop services:${NC}"
echo "  ${GREEN}docker-compose down${NC}"
echo ""
echo "${YELLOW}To rebuild and restart:${NC}"
echo "  ${GREEN}docker-compose down && docker-compose up -d --build${NC}"
echo ""
echo "${YELLOW}Backend logs (view errors):${NC}"
echo "  ${GREEN}docker-compose logs -f backend | tail -f 50${NC}"
echo ""

echo "${GREEN}🎯 Ready to use!${NC}"
echo ""
echo "${YELLOW}Open your browser to: http://localhost:5173${NC}"
echo ""
echo "${YELLOW}Test backend health:${NC}"
echo "  curl http://localhost:3001/api/health"
echo ""
echo "${YELLOW}Register a user and test AI integration!${NC}"
echo ""
