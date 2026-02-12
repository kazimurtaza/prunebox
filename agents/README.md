# Prunebox Agent Team

This directory contains the agent configuration files for the Prunebox development team.

## Team Structure

The team consists of 5 specialized agents that work together to continuously improve the Prunebox application:

### 1. Backend Developer
- **File**: `backend-developer.md`
- **Responsibilities**: API routes, Gmail integration, database schema, BullMQ workers
- **Works on**: `/src/app/api/`, `/src/modules/`, `/prisma/`
- **Polls**: Issues tagged `backend` or `backend-frontend`

### 2. Frontend Developer
- **File**: `frontend-developer.md`
- **Responsibilities**: UI/UX, React components, pages, styling
- **Works on**: `/src/app/`, `/src/components/`
- **Polls**: Issues tagged `frontend` or `backend-frontend`

### 3. Manual QA Tester
- **File**: `qa-tester.md`
- **Responsibilities**: Testing the application, creating bug reports, verifying fixes
- **Uses**: Chrome automation, DevTools
- **Creates**: Issues with appropriate tags

### 4. Code Reviewer
- **File**: `code-reviewer.md`
- **Responsibilities**: Reviewing pull requests, ensuring code quality
- **Reviews**: All PRs before merge
- **Ensures**: Security, performance, best practices

### 5. Local Deployer
- **File**: `local-deployer.md`
- **Responsibilities**: Deploying changes locally, managing services
- **Handles**: Migrations, service restarts, health checks
- **Notifies**: QA team when ready

## Workflow

```
1. QA Tester finds bugs → Creates GitHub issues with tags
       ↓
2. Developers poll issues → Create branches → Fix → Open PRs
       ↓
3. Code Reviewer reviews PRs → Approves/Merges
       ↓
4. Local Deployer deploys to local environment
       ↓
5. QA Tester tests new deployment → Cycle repeats
```

## Getting Started

Each agent should:
1. Read their role-specific instruction file
2. Review the shared context at `/home/murtaza/projects/prunebox/TEAM_CONTEXT.md`
3. Set up their local environment
4. Begin their assigned tasks

## Shared Context

All agents have access to:
- **Project Documentation**: `/home/murtaza/projects/prunebox/TEAM_CONTEXT.md`
- **Team Instructions**: `/home/murtaza/projects/prunebox/AGENT_INSTRUCTIONS.md`
- **GitHub Repository**: https://github.com/kazimurtaza/prunebox
- **Local Path**: `/home/murtaza/projects/prunebox`

## Task Coordination

The team uses a shared task list to coordinate work. Each agent can:
- View all tasks to understand team priorities
- Claim tasks appropriate to their role
- Update task status as they work
- Mark tasks as complete when done

## Communication

Team communication happens through:
- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code review and discussion
- **Comments**: Questions and clarifications
- **Task Updates**: Status changes and progress

## Success Metrics

Each role has specific success metrics:
- **QA Tester**: Bugs found and resolved
- **Developers**: PR merge rate, time to resolve
- **Code Reviewer**: Review turnaround, code quality
- **Deployer**: Deployment success rate, uptime

## Continuous Improvement

The team regularly:
- Reviews closed issues
- Identifies recurring problems
- Updates documentation
- Adjusts processes as needed
