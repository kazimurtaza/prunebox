# Agent Team Quick Reference

Quick commands and references for all Prunebox agents.

## Common Commands

```bash
# Project location
cd /home/murtaza/projects/prunebox

# Start services
npm run docker:up        # Start PostgreSQL and Redis

# Development
npm run dev              # Start Next.js dev server (port 3000)
npm run worker           # Start BullMQ workers

# Database
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio
npm run db:generate      # Generate Prisma client

# Build
npm run build            # Production build
npm run start            # Production server

# Git
git pull origin master   # Get latest changes
gh pr list               # List pull requests
gh issue list            # List issues
```

## Agent-Specific Commands

### Backend Developer

```bash
# Poll for backend issues
gh issue list --label backend
gh issue list --label backend-frontend

# Create branch
git checkout -b backend/issue-number-description

# After implementation
git push origin backend/issue-number-description
gh pr create --title "Backend: Description - Fixes #123"
```

### Frontend Developer

```bash
# Poll for frontend issues
gh issue list --label frontend
gh issue list --label backend-frontend

# Create branch
git checkout -b frontend/issue-number-description

# Add shadcn/ui component
npx shadcn@latest add [component-name]

# After implementation
git push origin frontend/issue-number-description
gh pr create --title "Frontend: Description - Fixes #123"
```

### QA Tester

```bash
# Check for urgent issues
gh issue list --label urgent

# Create bug report
gh issue create --title "Bug: Description" --label "bug,backend"

# Verify fix
gh issue close [issue-number] --comment "Verified fixed"
```

### Code Reviewer

```bash
# List open PRs
gh pr list

# Review PR
gh pr view [pr-number]
gh pr diff [pr-number]
gh pr review [pr-number] --approve
gh pr review [pr-number] --request-changes
gh pr review [pr-number] --comment

# Merge PR
gh pr merge [pr-number] --squash --delete-branch
```

### Local Deployer

```bash
# Deploy latest changes
git pull origin master
npm install                    # If dependencies changed
npm run db:push                # If schema changed
npm run dev &                  # Start dev server
npm run worker &               # Start workers

# Health check
curl http://localhost:3000
redis-cli ping
docker ps

# Stop services
pkill -f "npm run dev"
pkill -f "npm run worker"
```

## File Locations

### Backend
- API Routes: `/src/app/api/`
- Modules: `/src/modules/`
- Prisma Schema: `/prisma/schema.prisma`

### Frontend
- Pages: `/src/app/`
- Components: `/src/components/`
- UI Components: `/src/components/ui/`

### Configuration
- Environment: `.env`
- Next.js Config: `next.config.ts`
- Tailwind Config: `tailwind.config.ts`

## Issue Labels

Use these labels consistently:
- `backend` - Backend issues
- `frontend` - Frontend issues
- `backend-frontend` - Cross-cutting issues
- `bug` - Bug reports
- `enhancement` - Feature requests
- `urgent` - Critical issues

## Service URLs

- Application: http://localhost:3000
- Prisma Studio: http://localhost:5555 (when running)
- GitHub: https://github.com/kazimurtaza/prunebox

## Troubleshooting

### Port 3000 in use
```bash
lsof -i :3000
kill -9 [PID]
```

### Database connection issues
```bash
npm run docker:down
npm run docker:up
npm run db:push
```

### Redis connection issues
```bash
docker restart [redis-container]
redis-cli ping
```

### Clear everything and restart
```bash
npm run docker:down
pkill -f node
rm -rf .next node_modules
npm install
npm run docker:up
npm run db:push
npm run dev
```

## Documentation

- Team Context: `/home/murtaza/projects/prunebox/TEAM_CONTEXT.md`
- Team Instructions: `/home/murtaza/projects/prunebox/AGENT_INSTRUCTIONS.md`
- Agent Roles: `/home/murtaza/projects/prunebox/agents/[role].md`
