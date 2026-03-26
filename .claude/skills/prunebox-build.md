---
name: prunebox-build
description: Use when working with Prunebox builds, Docker images, versioning, or promoting code from dev to production
---

# Prunebox Build Guide

## Quick Reference

| Action | Command | Result |
|--------|---------|--------|
| Dev build | `git push origin develop` | `:develop` image |
| Production | `git push origin master` | `:master` image |
| Release | `git tag v0.5.0 && git push origin v0.5.0` | `:latest` + version tags + release |

## Build Workflows

### Dev Flow
```
git push origin develop
  → docker-dev.yml triggers
  → builds ghcr.io/kazimurtaza/prunebox:develop
  → Portainer can pull :develop for testing
```

### Production Flow
```
git push origin master
  → docker-release.yml triggers
  → builds ghcr.io/kazimurtaza/prunebox:master

# OR create versioned release
git tag v0.5.0 && git push origin v0.5.0
  → docker-release.yml triggers
  → builds :latest, :v0.5.0, :v0.5, :v0
  → creates GitHub Release
  → Portainer auto-deploys :latest every 24h
```

### GitFlow
```
develop (dev work)
  ↓ merge when ready
master (production)
  ↓ tag for releases
vX.Y.Z tags
```

### Version Rules
- `v0.5.0` ✅ → Updates `:latest`, creates release
- `develop` tag ✅ → `:develop` image, NO release
- Push to `develop` → `:develop` image
- Push to `master` → `:master` image

## Key Files

### CI/CD Workflows
| File | Purpose |
|------|---------|
| `.github/workflows/test.yml` | Quality gates (lint + type-check) |
| `.github/workflows/docker-dev.yml` | Dev builds on develop push |
| `.github/workflows/docker-release.yml` | Production builds on master/tags |

### Docker & Build
| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (1.36GB optimized) |
| `.dockerignore` | Excludes test files, dev artifacts |
| `docker-compose.production.yml` | Production deployment (uses env_file) |
| `docker-compose.dev.yml` | Development deployment |
| `docker/supervisord.conf` | Runs app and PostgreSQL |

### Build Configuration
| File | Purpose |
|------|---------|
| `package.json` | Build script: `npm run build` (Next.js only) |

## How Docker Optimization Works

The Dockerfile uses multi-stage builds:

1. **deps** - Install all dependencies
2. **builder** - Build Next.js app
3. **runner** - Minimal runtime with production deps

## Environment Setup

### Production Environment
1. Create `.env` file with required values:
   - Database credentials
   - Auth secrets (NEXTAUTH_SECRET, ENCRYPTION_KEY)
   - OAuth credentials
   - GA_MEASUREMENT_ID

### Deploy
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Development Deploy
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## Common Commands

### Development
```bash
# Build and run locally
docker-compose up

# Build dev image
docker build -t prunebox:develop .
```

### Promote to Production
```bash
# Option 1: Merge develop to master
git checkout master
git merge develop
git push origin master

# Option 2: Create versioned release
git checkout master
git tag v0.5.0
git push origin v0.5.0
```

### Check Images
```bash
# Pull images
docker pull ghcr.io/kazimurtaza/prunebox:develop
docker pull ghcr.io/kazimurtaza/prunebox:latest

# List local images
docker images | grep prunebox
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Dev build not triggering | Push to `develop` branch |
| Production not triggering | Push to `master` branch |
| `:latest` not updating | Check pushing to `master`, not `develop` |
| `:develop` tag not found | Push to `develop` branch, don't use `:dev` |
| Image too large | ~1.2GB is expected (no Redis/worker overhead) |
| Portainer not updating | Wait 24h for auto-deploy OR manually redeploy |
| Duplicate empty states | Fixed - SubscriptionList handles empty state |

## Quality Gates

Before builds:
- ESLint runs
- TypeScript type-check runs

Broken code fails CI and prevents deployment.
