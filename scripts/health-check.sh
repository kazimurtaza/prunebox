#!/bin/bash

# =============================================================================
# PRUNEBOX HEALTH CHECK SCRIPT
# =============================================================================
# This script performs health checks on all Prunebox services
# Used by Local Deployer to verify deployment success
#
# Usage: ./scripts/health-check.sh [--verbose]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
VERBOSE=false
if [ "$1" == "--verbose" ]; then
    VERBOSE=true
fi

# Track overall status
ALL_GOOD=true

# Header
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  PRUNEBOX HEALTH CHECK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# =============================================================================
# 1. Docker Services Check
# =============================================================================
echo -e "${BLUE}Checking Docker Services...${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running${NC}"
    ALL_GOOD=false
else
    echo -e "${GREEN}Docker is running${NC}"

    # Check PostgreSQL container
    if docker ps --format "{{.Names}}" | grep -q "prunebox-postgres"; then
        POSTGRES_STATUS=$(docker inspect --format='{{.State.Health.Status}}' prunebox-postgres 2>/dev/null || echo "unknown")
        if [ "$POSTGRES_STATUS" == "healthy" ]; then
            echo -e "${GREEN}PostgreSQL container is healthy${NC}"
        else
            echo -e "${YELLOW}PostgreSQL status: $POSTGRES_STATUS${NC}"
            ALL_GOOD=false
        fi
    else
        echo -e "${RED}PostgreSQL container is not running${NC}"
        ALL_GOOD=false
    fi

    # Check Redis container
    if docker ps --format "{{.Names}}" | grep -q "prunebox-redis"; then
        REDIS_STATUS=$(docker inspect --format='{{.State.Health.Status}}' prunebox-redis 2>/dev/null || echo "unknown")
        if [ "$REDIS_STATUS" == "healthy" ]; then
            echo -e "${GREEN}Redis container is healthy${NC}"
        else
            echo -e "${YELLOW}Redis status: $REDIS_STATUS${NC}"
            ALL_GOOD=false
        fi
    else
        echo -e "${RED}Redis container is not running${NC}"
        ALL_GOOD=false
    fi
fi

echo ""

# =============================================================================
# 2. Database Connection Check
# =============================================================================
echo -e "${BLUE}Checking Database Connection...${NC}"

# Try to connect to PostgreSQL via Docker
if docker exec prunebox-postgres pg_isready -U prunebox &> /dev/null; then
    echo -e "${GREEN}PostgreSQL is accepting connections${NC}"
else
    echo -e "${RED}PostgreSQL is not accepting connections${NC}"
    ALL_GOOD=false
fi

echo ""

# =============================================================================
# 3. Redis Connection Check
# =============================================================================
echo -e "${BLUE}Checking Redis Connection...${NC}"

# Try to ping Redis via Docker
REDIS_PING=$(docker exec prunebox-redis redis-cli ping 2>/dev/null || echo "failed")
if [ "$REDIS_PING" == "PONG" ]; then
    echo -e "${GREEN}Redis is responding${NC}"
else
    echo -e "${RED}Redis is not responding${NC}"
    ALL_GOOD=false
fi

echo ""

# =============================================================================
# 4. Next.js Application Check
# =============================================================================
echo -e "${BLUE}Checking Next.js Application...${NC}"

# Check if port 3000 is listening
if lsof -i :3000 -sTCP:LISTEN -t &> /dev/null; then
    echo -e "${GREEN}Application is listening on port 3000${NC}"

    # Try HTTP request
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 5 || echo "000")

    if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "304" ]; then
        echo -e "${GREEN}Application is responding - HTTP $HTTP_STATUS${NC}"
    else
        echo -e "${YELLOW}Application returned HTTP $HTTP_STATUS${NC}"
        if [ "$VERBOSE" == true ]; then
            echo -e "${YELLOW}The application may still be starting up...${NC}"
        fi
    fi
else
    echo -e "${RED}Application is not listening on port 3000${NC}"
    ALL_GOOD=false
fi

echo ""

# =============================================================================
# 5. Environment Variables Check
# =============================================================================
echo -e "${BLUE}Checking Environment Configuration...${NC}"

if [ -f .env ]; then
    echo -e "${GREEN}.env file exists${NC}"

    # Source the .env file safely
    set -a
    source .env
    set +a

    # Check critical variables
    if [ -n "$DATABASE_URL" ]; then
        echo -e "${GREEN}DATABASE_URL is set${NC}"
    else
        echo -e "${RED}DATABASE_URL is not set${NC}"
        ALL_GOOD=false
    fi

    if [ -n "$REDIS_URL" ]; then
        echo -e "${GREEN}REDIS_URL is set${NC}"
    else
        echo -e "${RED}REDIS_URL is not set${NC}"
        ALL_GOOD=false
    fi

    if [ -n "$NEXTAUTH_SECRET" ]; then
        if [ ${#NEXTAUTH_SECRET} -ge 32 ]; then
            echo -e "${GREEN}NEXTAUTH_SECRET is properly configured${NC}"
        else
            echo -e "${YELLOW}NEXTAUTH_SECRET is too short${NC}"
        fi
    else
        echo -e "${RED}NEXTAUTH_SECRET is not set${NC}"
        ALL_GOOD=false
    fi
else
    echo -e "${RED}.env file not found${NC}"
    ALL_GOOD=false
fi

echo ""

# =============================================================================
# 6. BullMQ Worker Check (Optional)
# =============================================================================
echo -e "${BLUE}Checking Background Workers...${NC}"

# Check if worker process is running
if pgrep -f "tsx src/modules/queues/workers.run.ts" > /dev/null; then
    echo -e "${GREEN}BullMQ worker process is running${NC}"
else
    echo -e "${YELLOW}BullMQ worker process not found - may not be started${NC}"
fi

echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$ALL_GOOD" == true ]; then
    echo -e "${GREEN}All critical services are healthy${NC}"
    echo ""
    echo -e "${BLUE}Application URL: ${GREEN}http://localhost:3000${NC}"
    exit 0
else
    echo -e "${RED}Some health checks failed${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting steps:${NC}"
    echo -e "  1. Start Docker services: npm run docker:up"
    echo -e "  2. Start the application: npm run dev"
    echo -e "  3. Start the worker: npm run worker"
    echo -e "  4. Check logs: docker logs prunebox-postgres prunebox-redis"
    exit 1
fi
