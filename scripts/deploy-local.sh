#!/bin/bash

# =============================================================================
# PRUNEBOX LOCAL DEPLOYMENT SCRIPT
# =============================================================================
# This script automates the local deployment process for merged PRs
# Used by Local Deployer to deploy changes to the development environment
#
# Usage: ./scripts/deploy-local.sh [--skip-dependencies] [--skip-migrations]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_DEPS=false
SKIP_MIGRATIONS=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-dependencies)
            SKIP_DEPS=true
            shift
            ;;
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--skip-dependencies] [--skip-migrations] [--verbose]"
            exit 1
            ;;
    esac
done

# Header
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  PRUNEBOX LOCAL DEPLOYMENT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get current commit
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_BRANCH=$(git branch --show-current)

echo -e "${BLUE}Current Branch:${NC} $CURRENT_BRANCH"
echo -e "${BLUE}Current Commit:${NC} $CURRENT_COMMIT"
echo ""

# =============================================================================
# 1. Pre-Deployment Checks
# =============================================================================
echo -e "${BLUE}Step 1: Pre-Deployment Checks${NC}"

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

# Check if on master branch
if [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${YELLOW}Warning: Not on master branch - current: $CURRENT_BRANCH${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Pre-deployment checks passed${NC}"
echo ""

# =============================================================================
# 2. Pull Latest Changes
# =============================================================================
echo -e "${BLUE}Step 2: Pulling Latest Changes${NC}"

# Get commit before pull
BEFORE_COMMIT=$(git rev-parse HEAD)

git fetch origin
if [ "$CURRENT_BRANCH" == "master" ]; then
    git pull origin master
else
    echo -e "${YELLOW}Not pulling from master - not on master branch${NC}"
fi

# Get commit after pull
AFTER_COMMIT=$(git rev-parse HEAD)

if [ "$BEFORE_COMMIT" != "$AFTER_COMMIT" ]; then
    echo -e "${GREEN}New changes pulled${NC}"
    echo -e "${BLUE}  Previous: $BEFORE_COMMIT${NC}"
    echo -e "${BLUE}  Current:  $AFTER_COMMIT${NC}"
else
    echo -e "${YELLOW}No new changes to pull${NC}"
fi

echo ""

# =============================================================================
# 3. Check for Dependency Changes
# =============================================================================
echo -e "${BLUE}Step 3: Checking for Dependency Changes${NC}"

# Check if package.json or package-lock.json changed
if git diff --quiet "$BEFORE_COMMIT" "$AFTER_COMMIT" -- package.json package-lock.json; then
    echo -e "${BLUE}No dependency changes detected${NC}"
else
    echo -e "${YELLOW}Dependency changes detected${NC}"

    if [ "$SKIP_DEPS" == true ]; then
        echo -e "${YELLOW}Skipping dependency install - --skip-dependencies flag used${NC}"
    else
        echo -e "${BLUE}Installing dependencies...${NC}"
        npm install

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Dependencies installed successfully${NC}"
        else
            echo -e "${RED}Dependency installation failed${NC}"
            exit 1
        fi
    fi
fi

echo ""

# =============================================================================
# 4. Check for Database Schema Changes
# =============================================================================
echo -e "${BLUE}Step 4: Checking for Database Schema Changes${NC}"

# Check if prisma/schema.prisma changed
if [ -f "prisma/schema.prisma" ]; then
    if git diff --quiet "$BEFORE_COMMIT" "$AFTER_COMMIT" -- prisma/schema.prisma; then
        echo -e "${BLUE}No schema changes detected${NC}"
    else
        echo -e "${YELLOW}Schema changes detected${NC}"

        if [ "$SKIP_MIGRATIONS" == true ]; then
            echo -e "${YELLOW}Skipping migrations - --skip-migrations flag used${NC}"
        else
            echo -e "${BLUE}Running database migrations...${NC}"
            npm run db:push

            if [ $? -eq 0 ]; then
                echo -e "${GREEN}Database migrations completed${NC}"
            else
                echo -e "${RED}Database migrations failed${NC}"
                exit 1
            fi
        fi
    fi
else
    echo -e "${YELLOW}prisma/schema.prisma not found${NC}"
fi

echo ""

# =============================================================================
# 5. Verify Docker Services
# =============================================================================
echo -e "${BLUE}Step 5: Verifying Docker Services${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running${NC}"
    echo -e "${YELLOW}Start Docker and try again${NC}"
    exit 1
fi

# Check if PostgreSQL container is running
if docker ps --format "{{.Names}}" | grep -q "prunebox-postgres"; then
    echo -e "${GREEN}PostgreSQL container is running${NC}"
else
    echo -e "${YELLOW}PostgreSQL container is not running${NC}"
    echo -e "${BLUE}Starting Docker services...${NC}"
    npm run docker:up

    # Wait for containers to be healthy
    echo -e "${BLUE}Waiting for services to be ready...${NC}"
    sleep 5
fi

# Check if Redis container is running
if docker ps --format "{{.Names}}" | grep -q "prunebox-redis"; then
    echo -e "${GREEN}Redis container is running${NC}"
else
    echo -e "${YELLOW}Redis container is not running${NC}"
    echo -e "${BLUE}Starting Docker services...${NC}"
    npm run docker:up

    # Wait for containers to be healthy
    echo -e "${BLUE}Waiting for services to be ready...${NC}"
    sleep 5
fi

echo ""

# =============================================================================
# 6. Service Restart Instructions
# =============================================================================
echo -e "${BLUE}Step 6: Service Restart${NC}"

echo -e "${YELLOW}Services need to be restarted manually${NC}"
echo ""
echo -e "${BLUE}Please restart the following services:${NC}"
echo ""
echo -e "${GREEN}1. Development Server:${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo -e "${GREEN}2. Background Worker:${NC}"
echo -e "   ${BLUE}npm run worker${NC}"
echo ""
read -p "Press Enter once services have been restarted..."

echo ""

# =============================================================================
# 7. Health Check
# =============================================================================
echo -e "${BLUE}Step 7: Running Health Checks${NC}"

./scripts/health-check.sh

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  DEPLOYMENT SUCCESSFUL${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Commit:${NC} $AFTER_COMMIT"
    echo -e "${BLUE}URL:${NC}    http://localhost:3000"
    echo ""
    echo -e "${GREEN}Ready for testing${NC}"
    echo ""

    # Log deployment
    DEPLOYMENT_LOG="docs/deployments/$(date +%Y%m%d-%H%M%S)-deployment.md"
    mkdir -p docs/deployments
    cat > "$DEPLOYMENT_LOG" << EOF
# Deployment Report - $(date +%Y-%m-%d)

## Changes Deployed
- **Commit**: $AFTER_COMMIT
- **Previous**: $BEFORE_COMMIT
- **Branch**: $CURRENT_BRANCH

## Services Restarted
- [x] Docker Services (PostgreSQL, Redis)
- [x] Next.js Dev Server
- [x] BullMQ Workers

## Issues Encountered
None

## Status
Success

## QA Ready
- URL: http://localhost:3000
- Services: All running

EOF

    echo -e "${BLUE}Deployment log saved to:${NC} $DEPLOYMENT_LOG"

    exit 0
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  DEPLOYMENT FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Please check the errors above and try again${NC}"
    exit 1
fi
