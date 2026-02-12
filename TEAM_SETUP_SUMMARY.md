# Prunebox Agent Team - Setup Complete

## Summary

The Prunebox Agent Team has been successfully created and configured. This team will continuously improve the Prunebox Gmail subscription management SaaS through a testing-driven development cycle.

## Team Structure

### 5 Specialized Agents

1. **Backend Developer** (`agents/backend-developer.md`)
   - Handles API routes, Gmail integration, database schema, BullMQ workers
   - Polls issues tagged: `backend`, `backend-frontend`
   - Branch prefix: `backend/`

2. **Frontend Developer** (`agents/frontend-developer.md`)
   - Handles UI/UX, React components, Next.js pages, TailwindCSS styling
   - Polls issues tagged: `frontend`, `backend-frontend`
   - Branch prefix: `frontend/`

3. **Manual QA Tester** (`agents/qa-tester.md`)
   - Tests application with Chrome automation
   - Creates detailed GitHub issues with appropriate tags
   - Verifies fixes and closes resolved issues

4. **Code Reviewer** (`agents/code-reviewer.md`)
   - Reviews all pull requests
   - Ensures code quality, security, and best practices
   - Approves and merges PRs

5. **Local Deployer** (`agents/local-deployer.md`)
   - Deploys merged changes to local environment
   - Manages database migrations and service restarts
   - Notifies QA team when ready for testing

## Workflow

```
QA Tester → Tests app → Creates issues (tagged backend/frontend)
     ↓
Developers → Poll issues → Fix → Create PRs
     ↓
Code Reviewer → Reviews PRs → Merges
     ↓
Local Deployer → Deploys locally → Notifies QA
     ↓
QA Tester → Verifies fixes → Cycle repeats
```

## Documentation Structure

### Root Level
- `/TEAM_CONTEXT.md` - Comprehensive project documentation
- `/AGENT_INSTRUCTIONS.md` - Team workflow and protocols
- `/README.md` - Updated with agent team section

### Agents Directory (`/agents/`)
- `/agents/README.md` - Team overview and coordination
- `/agents/quick-reference.md` - Common commands and troubleshooting
- `/agents/backend-developer.md` - Backend Developer role instructions
- `/agents/frontend-developer.md` - Frontend Developer role instructions
- `/agents/qa-tester.md` - QA Tester role instructions
- `/agents/code-reviewer.md` - Code Reviewer role instructions
- `/agents/local-deployer.md` - Local Deployer role instructions

## Shared Task List

The team has been initialized with the following tasks:

1. ✅ **Set up Prunebox Agent Team Infrastructure** (COMPLETED)
   - Created all documentation files
   - Established team structure
   - Set up communication protocols

2. **Baseline Environment Verification** (Pending - QA Tester)
   - Verify application starts correctly
   - Test all services
   - Document any issues

3. **Initial Codebase Review** (Pending - Code Reviewer)
   - Review code structure
   - Check for type safety
   - Identify security concerns

4. **Local Deployment Pipeline Setup** (Pending - Local Deployer)
   - Configure deployment process
   - Create health check scripts
   - Document procedures

## Project Context

- **Repository**: https://github.com/kazimurtaza/prunebox
- **Local Path**: /home/murtaza/projects/prunebox
- **Tech Stack**: Next.js 15, React 19, TypeScript, PostgreSQL, Prisma, BullMQ, Redis
- **Main Branch**: master

## GitHub Labels

The team uses these labels for coordination:
- `backend` - Backend-only issues
- `frontend` - Frontend-only issues
- `backend-frontend` - Cross-cutting issues
- `bug` - Bug reports
- `enhancement` - Feature requests
- `urgent` - Critical blocking issues

## Quick Start

Each agent should:
1. Read their role-specific file in `/agents/`
2. Review `/TEAM_CONTEXT.md` for project understanding
3. Review `/AGENT_INSTRUCTIONS.md` for team protocols
4. Check the shared task list for their assigned tasks
5. Begin work according to their role

## Communication

- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code review and discussion
- **Task List**: Shared task coordination
- **Comments**: Questions and clarifications

## Next Steps

1. **QA Tester**: Run baseline environment verification
2. **Code Reviewer**: Perform initial codebase review
3. **Local Deployer**: Set up deployment pipeline
4. **Developers**: Wait for issues to be tagged and assigned
5. **All**: Review documentation and understand roles

## Success Criteria

The team is successful when:
- Bugs are found and fixed quickly
- Code quality is maintained
- Deployments are smooth
- QA testing is thorough
- Communication is clear

---

**Team Setup Date**: 2026-02-11
**Project**: Prunebox - Privacy-first Gmail subscription management SaaS
