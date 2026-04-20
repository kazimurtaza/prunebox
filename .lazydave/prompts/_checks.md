# Smoke Check Steps

Auto-generated from smoke-checks manifest. Do not edit manually.

## api
### V6: Health check endpoint responds
Run dev server and GET /api/health returns 200

### VR.109: Health check endpoint returns database connectivity status
Verify: Health check endpoint returns database connectivity status

### VR.110: Gmail webhook endpoint verifies HMAC SHA256 signature
Verify: Gmail webhook endpoint verifies HMAC SHA256 signature

### VR.111: Subscription subjects endpoint returns recent email subjects by sender
Verify: Subscription subjects endpoint returns recent email subjects by sender

### VR.112: Scan-sender endpoint rescans subscriptions after bulk delete
Verify: Scan-sender endpoint rescans subscriptions after bulk delete

### VR.113: Sync reset endpoint clears all user subscription data
Verify: Sync reset endpoint clears all user subscription data

### VR.114: Scan status endpoint returns real-time scan progress
Verify: Scan status endpoint returns real-time scan progress

### V135: Subscription action API endpoint processes keep/unsubscribe/rollup actions
Run authenticated POST request to /api/subscriptions/action with body {subscriptionId: '<valid_id>', action: 'keep'|'unsubscribe'|'rollup'} and verify: 200 response with {success: true}, subscriptionPreference record created/updated in database with correct action, unsubscribe action queues job to unsubscribe-queue, rollup action schedules daily digest via scheduleDailyRollup, keep action with no remaining rollups removes scheduled digest

### V136: Subscription GET API endpoint returns paginated results with cursor
Run authenticated GET request to /api/subscriptions with no parameters and verify: response contains {subscriptions: [], hasMore: boolean, nextCursor: string|null}, defaults to limit=50, subscriptions include id, senderEmail, senderName, messageCount, recentSubject, lastSeenAt, confidenceScore, listUnsubscribeHeader, action fields; then call again with cursor parameter and verify results paginate correctly

## architecture
### VR.131: Gmail email monitoring implemented via history API polling or Pub/Sub push notifications
Verify existence of email monitoring worker in src/modules/queues/workers.ts; check for history.list API calls in src/modules/gmail/client.ts; verify BullMQ job scheduled for periodic monitoring (cron pattern every 5-15 minutes); for Pub/Sub, verify users.watch() registration and webhook renewal job

### VR.132: PostgreSQL service included in docker-compose files
Run 'docker compose config' on each docker-compose file and verify postgres service exists; check that prunebox service depends on postgres with healthcheck; verify DATABASE_URL uses container hostname (e.g., postgres:5432); confirm postgres volume is defined

## auth
### V8: NextAuth configuration is valid
Verify src/modules/auth/auth.config.ts exports valid auth options

## build
### V1: Next.js production build succeeds
Run 'npm run build' and verify build completes without errors

### V2: ESLint passes with no errors
Run 'npm run lint' and verify no linting errors

## config
### V5: TypeScript compilation succeeds
Run 'npx tsc --noEmit' to verify type safety

## database
### V3: Prisma schema is valid
Run 'npx prisma validate' to verify schema syntax

### V4: Database migrations can be generated
Run 'npx prisma migrate dev' successfully creates migrations

### VR.122: Unsubscription attempts are tracked with status and error messages
Verify: Unsubscription attempts are tracked with status and error messages

### VR.123: Bulk deletion jobs track total and deleted message counts
Verify: Bulk deletion jobs track total and deleted message counts

## detection
### VR.133: Subscription detection algorithm implements all spec requirements with improvements
Verify src/modules/gmail/detection.ts detectSubscription() function checks: List-Unsubscribe header (lines 23-55), List-Id header (lines 58-63), Precedence header (lines 66-72), Auto-Submitted header (lines 75-81), sender patterns (lines 88-130), ESP domain patterns (lines 133-159). Verify parseSender() utility (lines 169-189) and parseMailtoUnsubscribe() utility (lines 194-208). Confirm all spec signals covered plus improvements documented in issue #116.

## docker
### V7: Docker Compose builds successfully
Run 'docker-compose build' completes without errors

## env
### V11: Environment variables are documented
Verify .env.example contains all required environment variables

## frontend
### VR.115: Landing page displays privacy-first messaging and feature cards
Verify: Landing page displays privacy-first messaging and feature cards

### VR.116: How-it-works page displays 4-step process and detection explanation
Verify: How-it-works page displays 4-step process and detection explanation

### VR.117: Rollup page displays email groups in digest with delivery schedule
Verify: Rollup page displays email groups in digest with delivery schedule

### VR.118: Settings page displays three tabs: Account, Notifications, Privacy
Verify: Settings page displays three tabs: Account, Notifications, Privacy

### VR.119: Deploy page displays Docker Compose and configuration instructions
Verify: Deploy page displays Docker Compose and configuration instructions

## pages
### V134: 404 Not Found page displays proper styling and navigation options
Navigate to a non-existent route (e.g., /nonexistent-page) and verify: 404 status code, page shows '404' heading, 'Page Not Found' title, apology message, three navigation buttons (Go Home, Dashboard, Go Back), proper styling with primary color for main button

## queues
### V9: BullMQ queue configuration loads
Verify src/modules/queues/config.ts exports valid queue configuration

## regression
### VR.108.d: Regression: Complete BullMQ + Redis job queue system end-to-end
Verify: Regression: Complete BullMQ + Redis job queue system end-to-end

### VR.108.c: Regression: Instrumentation file at project root for Next.js to load
Verify: Regression: Instrumentation file at project root for Next.js to load

### VR.108.b: Regression: BullMQ worker lifecycle management via instrumentation
Verify: Regression: BullMQ worker lifecycle management via instrumentation

### VR.108: Regression: Daily rollup digest scheduling with cleanup
Verify: Regression: Daily rollup digest scheduling with cleanup

### VR.40: Regression: BullMQ + Redis job queue system implemented
Verify: Regression: BullMQ + Redis job queue system implemented

### VR.39: Regression: Library modules source correctly in bash/zsh
Verify: Regression: Library modules source correctly in bash/zsh

### VR.108.e: Regression: BullMQ queues lazy-loaded to prevent build-time Redis connections
Verify: Regression: BullMQ queues lazy-loaded to prevent build-time Redis connections

## security
### V10: Next.js security headers are configured
Verify next.config.ts includes security headers (CSP, X-Frame-Options, etc.)

### VR.120: OAuth tokens are encrypted at rest in database using AES-256
Verify: OAuth tokens are encrypted at rest in database using AES-256

### VR.121: Prisma middleware automatically encrypts/decrypts tokens on read/write
Verify: Prisma middleware automatically encrypts/decrypts tokens on read/write

## ui
### V12: Root layout renders without errors
Verify src/app/layout.tsx is valid and includes providers

### VR.124: Subscription list supports sort by email count, date, name, confidence
On dashboard, open sort dropdown and verify options: Most/Least Recent, Most/Least Emails, Name (A-Z/Z-A), Highest/Lowest Confidence; select each option and verify list reorders correctly

### VR.125: Subscription list filter buttons work correctly (all, high-confidence, low-confidence, has-unsubscribe)
On dashboard, click each filter button and verify: 'All' shows all subscriptions with count, 'High Confidence' shows only subscriptions with confidence >= 70%, 'Low Confidence' shows < 50%, 'Has Unsubscribe' shows only those with listUnsubscribeHeader

### VR.126: Subscription list bulk actions (delete all, unsubscribe) process selected items
Select multiple subscriptions using checkboxes, verify 'N selected' badge appears, click 'Delete All Emails' and confirm deletion dialog shows correct email counts; click 'Unsubscribe' and verify all selected are queued for unsubscription

### VR.127: Subscription card expandable section shows recent email subjects
Click chevron on any subscription card and verify expandable section appears showing 'Recent emails from this sender:' with up to 15 subject lines; verify loading spinner appears while fetching via `/api/subscriptions/subjects`

### VR.128: Subscription list height is resizable with drag handle and persists to localStorage
Drag the resize handle at bottom of subscription list and verify height changes; double-click handle to reset to default; reload page and verify saved height persists from localStorage key 'subscription-list-height'

### VR.129: Scan button displays status (idle, scanning, error, success) with icon changes
On dashboard, observe Scan button in idle state shows 'Scan Inbox'; click to start scan and verify button shows 'Scanning...' with spinner and progress percentage; after completion, verify success state or error message if failed

### VR.130: Theme toggle switches between light and dark modes
Click theme toggle button in header and verify: page switches between light/dark color schemes; theme persists across page reloads using localStorage or user preference

