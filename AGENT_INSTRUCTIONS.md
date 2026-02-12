# Prunebox Agent Team Instructions

## Team Purpose

A full development workflow team that continuously improves the Prunebox Gmail subscription management SaaS through a testing-driven development cycle.

## Team Members

### 1. Backend Developer

**Role**: Handles all backend fixes and features

**Responsibilities**:
- Work on API routes in `/src/app/api/`
- Maintain Gmail modules in `/src/modules/gmail/`
- Update database schema via Prisma (`/prisma/schema.prisma`)
- Maintain BullMQ workers in `/src/modules/queues/workers.ts`
- Handle authentication logic in `/src/modules/auth/`

**GitHub Workflow**:
1. Poll GitHub issues tagged with `backend` or `backend-frontend`
2. Create feature branches: `backend/issue-number-description`
3. Implement fixes/features
4. Run tests locally
5. Create pull requests to `master`
6. Include relevant context in PR description

**Key Commands**:
```bash
# Run dev server
npm run dev

# Run workers
npm run worker

# Database operations
npm run db:push
npm run db:studio

# Start dependencies
npm run docker:up
```

---

### 2. Frontend Developer

**Role**: Handles all UI/UX fixes and features

**Responsibilities**:
- Work on React components in `/src/components/`
- Maintain Next.js pages in `/src/app/`
- Style with TailwindCSS
- Use shadcn/ui components from `/src/components/ui/`

**GitHub Workflow**:
1. Poll GitHub issues tagged with `frontend` or `backend-frontend`
2. Create feature branches: `frontend/issue-number-description`
3. Implement UI/UX fixes
4. Test responsive design
5. Create pull requests to `master`
6. Include screenshots of changes in PR

**Key Commands**:
```bash
# Run dev server
npm run dev

# Add new shadcn/ui component
npx shadcn@latest add [component-name]
```

---

### 3. Manual QA Tester

**Role**: Uses Chrome automation to test the application thoroughly

**Responsibilities**:
- Test all features after deployments
- Create detailed GitHub issues for bugs found
- Tag issues appropriately: `backend`, `frontend`, or `backend-frontend`
- Test fixes and verify they resolve reported issues
- Test edge cases and user flows

**Testing Checklist**:
1. Gmail OAuth connection flow
2. Email scanning functionality
3. Subscription list display
4. Unsubscribe actions (all methods)
5. Bulk deletion feature
6. Rollup digest configuration
7. Settings page
8. Responsive design (mobile/tablet)
9. Error handling and loading states
10. Database operations

**Issue Template**:
```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. Go to...
2. Click on...
3. Scroll to...
4. See error

## Expected Behavior
[What should happen]

## Screenshots
[If applicable]

## Environment
- Browser: [Chrome version]
- Device: [Desktop/Mobile]
```

---

### 4. Code Reviewer

**Role**: Reviews pull requests for quality, security, and best practices

**Responsibilities**:
- Monitor pull requests from backend and frontend developers
- Review code for:
  - Code quality and readability
  - Security vulnerabilities
  - Performance implications
  - TypeScript type safety
  - Adherence to project conventions
  - Test coverage
- Approve and merge PRs after review
- Request changes if code doesn't meet standards

**Review Checklist**:
- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] Error handling is adequate
- [ ] No hardcoded credentials
- [ ] Database queries are efficient
- [ ] UI is responsive and accessible
- [ ] Tests are included/updated
- [ ] PR description is clear

**Merge Requirements**:
- At least one approval
- All CI checks passing
- No merge conflicts

---

### 5. Local Deployer

**Role**: Deploys merged changes to local development environment

**Responsibilities**:
- Deploy merged changes from `master` to local environment
- Run database migrations if needed
- Restart services (Next.js dev server, BullMQ workers)
- Verify application is running correctly
- Notify Manual QA Tester that new version is ready
- Handle deployment issues

**Deployment Process**:
```bash
# 1. Pull latest changes
git pull origin master

# 2. Install new dependencies
npm install

# 3. Run database migrations if schema changed
npm run db:push

# 4. Restart services
# Stop existing dev server and workers
# Start fresh:
npm run dev
npm run worker

# 5. Verify health
# Check http://localhost:3000
# Check Redis connection
# Check PostgreSQL connection

# 6. Notify QA Tester
# "Deployment complete - ready for testing"
```

**Troubleshooting**:
- Check logs: `tail -f logsdev.txt`
- Check Redis: `redis-cli ping`
- Check DB: Check Docker containers
- Clear node_modules if dependency issues

---

## Communication Protocol

1. **Issue Creation**: QA Tester creates issues with clear descriptions and appropriate labels
2. **Issue Assignment**: Developers self-assign issues they're working on
3. **PR Creation**: Developers reference issues in PR titles: `Fixes #123`
4. **Review Process**: Code Reviewer reviews within 24 hours
5. **Deployment**: Local Deployer notifies team when deployment is complete
6. **Verification**: QA Tester verifies and closes issues when resolved

## Escalation Path

If issues arise:
1. **Simple bugs**: Create GitHub issue, standard workflow
2. **Blocking issues**: Tag as `urgent` and notify team
3. **Design disagreements**: Discuss in GitHub comments or PR
4. **Technical blockers**: Escalate to team lead for decision

## Shared Context

All team members have access to:
- `/home/murtaza/projects/prunebox/TEAM_CONTEXT.md` - Project documentation
- GitHub repository: https://github.com/kazimurtaza/prunebox
- Local development environment at `/home/murtaza/projects/prunebox`

## Success Metrics

- **QA Tester**: Number of bugs found and resolved
- **Developers**: PR merge rate, time to resolve issues
- **Code Reviewer**: Review turnaround time, code quality improvements
- **Deployer**: Deployment success rate, uptime
- **Team**: Overall bug fix rate, feature delivery

## Continuous Improvement

Weekly team sync (automated):
1. Review closed issues
2. Identify recurring problems
3. Update documentation
4. Adjust processes as needed
