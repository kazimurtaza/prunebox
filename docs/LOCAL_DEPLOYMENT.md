# Local Deployment Guide

This guide documents the local deployment process for the Prunebox project.

## Overview

The local deployment pipeline ensures that merged changes are properly deployed to the development environment at `http://localhost:3000`. All services (PostgreSQL, Redis, Next.js, BullMQ Workers) must be running correctly.

## Deployment Scripts

### Health Check Script

`./scripts/health-check.sh [--verbose]`

Performs comprehensive health checks on all Prunebox services:

- **Docker Services**: Verifies PostgreSQL and Redis containers are running and healthy
- **Database Connection**: Tests PostgreSQL connectivity
- **Redis Connection**: Tests Redis connectivity
- **Next.js Application**: Checks if the app is responding on port 3000
- **Environment Variables**: Validates critical configuration
- **Background Workers**: Checks if BullMQ workers are running

Exit codes:
- `0` = All checks passed
- `1` = One or more checks failed

### Deployment Script

`./scripts/deploy-local.sh [--skip-dependencies] [--skip-migrations] [--verbose]`

Automates the deployment process:

1. **Pre-deployment checks**: Verifies git status and branch
2. **Pull latest changes**: Fetches from origin/master
3. **Dependency updates**: Installs new packages if package.json changed
4. **Database migrations**: Runs migrations if schema.prisma changed
5. **Service verification**: Ensures Docker services are running
6. **Service restart**: Prompts to restart npm run dev and npm run worker
7. **Health check**: Runs automated health checks
8. **Deployment log**: Creates a deployment report

Flags:
- `--skip-dependencies` - Skip npm install even if package.json changed
- `--skip-migrations` - Skip db:push even if schema.prisma changed
- `--verbose` - Enable verbose output

## Quick Start Deployment

```bash
# 1. Navigate to project
cd /home/murtaza/projects/prunebox

# 2. Run deployment script
./scripts/deploy-local.sh

# 3. When prompted, restart services in separate terminals:
#    Terminal 1: npm run dev
#    Terminal 2: npm run worker

# 4. Press Enter to continue health check
```

## Manual Deployment Steps

If you need to deploy manually without the script:

### 1. Pull Latest Changes

```bash
git fetch origin
git checkout master
git pull origin master
```

### 2. Update Dependencies (if needed)

```bash
# Check if package.json or package-lock.json changed
git diff HEAD@{1} package.json package-lock.json

# If changes exist, install
npm install
```

### 3. Run Database Migrations (if needed)

```bash
# Check if schema.prisma changed
git diff HEAD@{1} prisma/schema.prisma

# If changes exist, push schema
npm run db:push
```

### 4. Verify Docker Services

```bash
# Check services
docker ps

# Start if needed
npm run docker:up
```

### 5. Restart Application Services

```bash
# Terminal 1 - Development server
npm run dev

# Terminal 2 - Background workers
npm run worker
```

### 6. Health Check

```bash
./scripts/health-check.sh
```

## Service Management

### Docker Services

```bash
# Start PostgreSQL and Redis
npm run docker:up

# Stop services
npm run docker:down

# View logs
npm run docker:logs

# Check service status
docker ps
```

### Application Services

```bash
# Development server
npm run dev

# Background workers
npm run worker
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 [PID]
```

### Database Connection Errors

```bash
# Restart Docker services
npm run docker:down
npm run docker:up

# Re-run migrations
npm run db:push
```

### Redis Connection Errors

```bash
# Restart Redis
docker restart prunebox-redis

# Check Redis is running
docker ps | grep redis
docker exec prunebox-redis redis-cli ping
```

### Dependency Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

## Deployment Logs

Deployment logs are stored in `/docs/deployments/` with the format:
`YYYYMMDD-HHMMSS-deployment.md`

Each log contains:
- Commit hashes deployed
- Services restarted
- Issues encountered
- Deployment status

## Environment Variables

Ensure these are set in `.env`:

```bash
# Database
DATABASE_URL="postgresql://prunebox:prunebox@localhost:5432/prunebox"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[generate with openssl rand -base64 32]"

# Google OAuth
GOOGLE_CLIENT_ID="[your-client-id]"
GOOGLE_CLIENT_SECRET="[your-client-secret]"

# Encryption
ENCRYPTION_KEY="[32-character-key]"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Prunebox"
```

## Health Check Results

After each deployment, the health check script verifies:

| Service | Check | Command |
|---------|-------|---------|
| PostgreSQL | Container healthy | `docker inspect prunebox-postgres` |
| PostgreSQL | Accepting connections | `docker exec prunebox-postgres pg_isready` |
| Redis | Container healthy | `docker inspect prunebox-redis` |
| Redis | Responding to ping | `docker exec prunebox-redis redis-cli ping` |
| Next.js | Listening on port 3000 | `lsof -i :3000` |
| Next.js | HTTP response | `curl http://localhost:3000` |

## Next Steps After Deployment

1. **Verify application loads** at http://localhost:3000
2. **Check browser console** for errors
3. **Test critical paths** (login, subscriptions, etc.)
4. **Notify QA team** that deployment is ready

## Related Documentation

- `/agents/local-deployer.md` - Local Deployer role instructions
- `/TEAM_CONTEXT.md` - Team context and architecture
- `/docs/GOOGLE_OAUTH_SETUP.md` - OAuth setup guide
