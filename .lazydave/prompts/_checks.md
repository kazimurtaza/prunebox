# Smoke Check Steps

Auto-generated from smoke-checks manifest. Do not edit manually.

## api
### V5: Health check endpoint responds
Run dev server and curl http://localhost:3000/api/health, expect 200 OK

### V9: Subscription API endpoints exist
Verify src/app/api/subscriptions/route.ts exists with CRUD operations

### V21: Bulk action API endpoint handles delete, unsubscribe, and rollup for multiple subscriptions
Run dev server, authenticate, then POST to http://localhost:3000/api/subscriptions/bulk with {"subscriptionIds":["id1","id2"],"action":"delete"} and verify response includes success:true with count

### V22: Subscription action API endpoint updates single subscription preference
Run dev server, authenticate, then POST to http://localhost:3000/api/subscriptions/action with {"subscriptionId":"id","action":"keep"} and verify response includes success:true

### V23: Account delete API endpoint performs cascade deletion of all user data
Run dev server, authenticate, then POST to http://localhost:3000/api/account/delete and verify response includes success:true and user is signed out

### V24: Account export API endpoint returns JSON export of all user data
Run dev server, authenticate, then GET http://localhost:3000/api/account/export and verify response includes user profile, subscriptions, preferences, rollup settings, and sync state

### V25: Rollup settings API endpoint handles GET and PUT for digest configuration
Run dev server, authenticate, then GET http://localhost:3000/api/rollup/settings and verify response includes enabled, deliverySlot, timezone, digestName; then PUT with new values and verify update

### V26: Scan status API endpoint returns real-time scan progress
Run dev server, authenticate, then GET http://localhost:3000/api/scan/status and verify response includes scanStatus, scanProgress, scanTotal, errorMessage from GmailSyncState

### V16: Email subjects endpoint returns recent subjects for sender
Run dev server, authenticate, then curl 'http://localhost:3000/api/subscriptions/subjects?senderEmail=test@example.com' and verify response includes subjects array with up to 15 recent email subjects from that sender

### V17: Scan sender endpoint rescans specific sender for message count
Run dev server, authenticate, then POST to http://localhost:3000/api/subscriptions/scan-sender with {"senderEmail":"test@example.com"} and verify response returns success:true with count of messages found

### V18: Sync reset endpoint clears all scan data for user
Run dev server, authenticate, then POST to http://localhost:3000/api/sync/reset and verify response includes success:true and deletedCount showing subscriptions deleted, and sync state is reset to idle

### V27: Scan initiation endpoint starts email scan with rate limiting
Run dev server, authenticate, then POST to http://localhost:3000/api/scan and verify response includes success:true with message 'Scan started'; verify rate limit returns 429 when called twice within 1 minute

### V28: Development signin endpoint creates test user session
Run dev server in NODE_ENV=development, then POST to http://localhost:3000/api/dev-signin and verify response includes success:true with user object and next-auth.session-token cookie is set; verify returns 403 in production

### V29: Rate limiter enforces SCAN, BULK_ACTION, and WEBHOOK limits
Run dev server and verify src/lib/rate-limiter.ts exports RATE_LIMITS with SCAN (1/min), BULK_ACTION (10/min), WEBHOOK (100/min) configurations; verify InMemoryRateLimiter class implements cleanup interval and check() method

### V54: Gmail client retry logic with exponential backoff for rate limit handling
Verify src/modules/gmail/client.ts implements retry logic with exponential backoff in listMessages() and other API functions; check for retry count, delay calculation, and error logging

## auth
### V6: Authentication routes exist
Verify src/app/api/auth/[...nextauth]/route.ts exists and exports auth configuration

### V34: Development auth callback handles dev-test provider
Verify src/app/api/dev-auth/callback/route.ts exists and handles OAuth callback for dev-test provider (only available in development)

### V38: OAuth token refresh mechanism updates expired access tokens
Verify src/modules/gmail/client.ts contains token refresh logic in oauth2Client.on('tokens') callback; check that refresh tokens are persisted to database via Account model

### V43: Auth callback route handles OAuth redirect for dev-test provider
Run dev server and navigate to http://localhost:3000/api/dev-auth/callback; verify route processes OAuth callback and creates session for dev-test provider

## build
### V1: Application builds successfully
Run npm run build and verify production build completes without errors

## dashboard
### V15: Dashboard page renders
Run dev server and navigate to http://localhost:3000/dashboard, verify page loads

## database
### V3: Database schema is valid
Run npx prisma validate to check schema.prisma syntax

### V3: Database schema is valid
Run npx prisma validate to check schema.prisma syntax

### V4: Database migrations can be applied
Run npx prisma migrate deploy to verify migrations apply cleanly

### V36: Prisma Client generates successfully after schema validation
Run npx prisma generate and verify Prisma Client is generated without errors; check node_modules/.prisma/client contains generated files

## docker
### V11: Docker build succeeds
Run docker build -t prunebox . and verify image builds without errors

### V12: Docker compose configuration is valid
Run docker-compose config to verify compose file syntax

## env
### V13: Environment variables are documented
Verify .env.example exists with all required variables documented

## gmail
### V7: Gmail detection module exists
Verify src/modules/gmail/detection.ts contains subscription detection logic

### V48: Gmail sendEmail function sends email via Gmail API
Verify src/modules/gmail/client.ts exports sendEmail() function that calls gmail.users.messages.send() with RFC 822 formatted email; check function handles to, subject, and body parameters

### V49: Gmail listHistory function retrieves history records for incremental sync
Verify src/modules/gmail/client.ts exports listHistory() function that calls gmail.users.history.list() with historyId parameter; check function handles startHistoryId and pagination

### V50: Gmail getMessage function retrieves individual message by ID
Verify src/modules/gmail/client.ts exports getMessage() function that calls gmail.users.messages.get() with format='full' or format='metadata'; check function returns message with headers, payload, and body

### V51: Gmail getCurrentHistoryId function retrieves current history ID for user
Verify src/modules/gmail/client.ts exports getCurrentHistoryId() function that calls gmail.users.messages.list() with maxResults=1 to get current historyId; check function returns historyId as string

## infrastructure
### V30: Logger utility provides structured logging with levels
Verify src/lib/logger.ts exports logger singleton with debug(), info(), warn(), error() methods; verify LogLevel enum (DEBUG=0, INFO=1, WARN=2, ERROR=3) and environment-aware minLevel configuration

### V31: Error handling library provides standardized API responses
Verify src/lib/errors.ts exports ApiErrorResponse class with static methods (unauthorized, badRequest, notFound, conflict, forbidden, internal, tooManyRequests); verify withErrorHandling wrapper and requireFields validator

### V32: User tokens helper retrieves OAuth tokens from database
Verify src/lib/get-user-tokens.ts exports getUserTokens function that queries Account table by userId and provider='google' returning accessToken and refreshToken

### V37: Crypto module provides AES-256-GCM encryption and decryption functions
Verify src/lib/crypto.ts exports encrypt(), decrypt(), and getEncryptionKey() functions; run node -e "console.log(require('./src/lib/crypto.ts'))" to confirm module loads without errors

### V40: Error handling wrapper provides standardized API error responses
Verify src/lib/errors.ts exports withErrorHandling() higher-order function and ApiErrorResponse class; check that error responses include proper HTTP status codes and error messages

### V41: Logger utility provides structured logging with environment-aware levels
Verify src/lib/logger.ts exports logger singleton with debug(), info(), warn(), error() methods; check LogLevel enum and minLevel configuration based on NODE_ENV

### V42: Client-side logger provides browser logging capabilities
Verify src/lib/client-logger.ts exports clientLogger with methods matching server logger; check it handles browser console logging with proper formatting

### V46: BullMQ queues configure exponential backoff retry strategy with proper job retention policies
Verify src/modules/queues/queues.ts defines defaultJobOptions with attempts: 3, backoff type: 'exponential', removeOnComplete: { age: 24*3600, count: 1000 }, removeOnFail: { age: 7*24*3600, count: 5000 }; verify all 5 queues (email-scan, unsubscribe, bulk-delete, rollup-digest, history-monitor) use these options

### V47: Redis connection configures maxRetriesPerRequest and enableReadyCheck for BullMQ compatibility
Verify src/modules/queues/config.ts exports getRedisConnection() that creates Redis connection with maxRetriesPerRequest: null and enableReadyCheck: false for optimal BullMQ queue behavior

## lint
### V2: Code passes ESLint checks
Run npm run lint and verify no critical errors

## queues
### V8: Job queue configuration exists
Verify src/modules/queues/config.ts exists and defines queue connections

### V20: Job queue configuration defines all required queues
Verify src/modules/queues/config.ts exists and exports queue configurations for email-scan, unsubscribe, bulk-delete, rollup-digest, and history-monitor queues with Redis connection

### V33: BullMQ workers initialize with 5 queues and proper lifecycle
Verify instrumentation.ts exports register() function that imports and calls initializeWorkers() from src/modules/queues/workers.ts; verify workers.ts creates 5 workers (email-scan, unsubscribe, bulk-delete, rollup-digest, history-monitor) with event handlers for completed/failed/error

### V45: History monitoring initializes for all users with Google accounts on application startup
Verify src/modules/queues/queues.ts exports initializeHistoryMonitoringForAllUsers() function; check that workers.ts or instrumentation.ts calls this function during worker initialization to schedule history monitoring for existing users

### V52: History monitor job polls Gmail history API and triggers email scans for new messages
Verify src/modules/queues/jobs.ts exports runHistoryMonitor() function that calls listHistory() and runEmailScan() when new messages detected; check function updates historyId in GmailSyncState

### V53: BullMQ queues provide lazy-loaded singleton pattern with Redis connection
Verify src/modules/queues/queues.ts exports getUnsubscribeQueue(), getBulkDeleteQueue(), getRollupQueue(), and getHistoryMonitorQueue() functions that create queues on first call; check queues share same Redis connection

### V55: Email scan job processes messages and creates subscription records with confidence scoring
Verify src/modules/queues/jobs.ts exports runEmailScan() function that calls listMessages(), detectSubscription(), and creates Subscription records; check function handles incremental scanning, first-scan full scan logic, and updates GmailSyncState with progress

### V56: Unsubscribe job processes unsubscription attempts with multiple fallback methods
Verify src/modules/queues/jobs.ts exports runUnsubscribe() function that calls attemptUnsubscribe() with one-click, mailto, and HTTP fallback methods; check function updates Subscription record, creates UnsubscriptionAttempt audit trail, and handles errors gracefully

### V57: Bulk delete job processes mass message deletion with progress tracking
Verify src/modules/queues/jobs.ts exports runBulkDelete() function that queries messages by sender, calls batchDeleteMessages() in chunks, and updates BulkDeletionJob with deletedMessages count; check function handles rate limiting and partial failures

## regression
### VR.117: Regression: ThemeToggle added to rollup and settings pages (#117)
Verify: Regression: ThemeToggle added to rollup and settings pages (#117)

### VR.116: Regression: fix for #116
Verify: Regression: fix for #116

### VR.112: Regression: BullMQ + Redis job queue system implemented
Verify: Regression: BullMQ + Redis job queue system implemented

### VR.115: Regression: Docker Compose includes PostgreSQL service (#115)
Verify: Regression: Docker Compose includes PostgreSQL service (#115)

### VR.115: Regression: fix for #115
Verify: Regression: fix for #115

### VR.114: Regression: Gmail history API polling for email monitoring (#114)
Verify: Regression: Gmail history API polling for email monitoring (#114)

### VR.114: Regression: fix for #114
Verify: Regression: fix for #114

### VR.112: Regression: fix for #112
Verify: Regression: fix for #112

### VR.123: Regression: BulkDeletionJob records created in runBulkDelete (#109)
Verify: Regression: BulkDeletionJob records created in runBulkDelete (#109)

### VR.109: Regression: fix for #109
Verify: Regression: fix for #109

### VR.108: Regression: BullMQ + Redis job queue system fully implemented (#108)
Verify: Regression: BullMQ + Redis job queue system fully implemented (#108)

### VR.108: Regression: fix for #108
Verify: Regression: fix for #108

### VR.107: Regression: fix for #107
Verify: Regression: fix for #107

### VR.88: Regression: batchDeleteMessages uses batchDelete API (#110)
Verify: Regression: batchDeleteMessages uses batchDelete API (#110)

### VR.110: Regression: fix for #110
Verify: Regression: fix for #110

### VR.105: Regression: Google verification timeline and CASA costs documented (#105)
Verify: Regression: Google verification timeline and CASA costs documented (#105)

### VR.105: Regression: fix for #105
Verify: Regression: fix for #105

### VR.104: Regression: Dashboard navigation includes Rollup link and mobile menu (#104)
Verify: Regression: Dashboard navigation includes Rollup link and mobile menu (#104)

### VR.104: Regression: fix for #104
Verify: Regression: fix for #104

### VR.103: Regression: False GDPR compliance claims removed from how-it-works page (#103)
Verify: Regression: False GDPR compliance claims removed from how-it-works page (#103)

### VR.103: Regression: fix for #103
Verify: Regression: fix for #103

### VR.101: Regression: Theme toggle available on landing and sign-in pages (#101)
Verify: Regression: Theme toggle available on landing and sign-in pages (#101)

### VR.101: Regression: fix for #101
Verify: Regression: fix for #101

### VR.100: Regression: Deploy page responsive on mobile viewports (#100)
Verify: Regression: Deploy page responsive on mobile viewports (#100)

### VR.100: Regression: fix for #100
Verify: Regression: fix for #100

### VR.98: Regression: Rollup action button added to subscription list (#98)
Verify: Regression: Rollup action button added to subscription list (#98)

### VR.98: Regression: fix for #98
Verify: Regression: fix for #98

### VR.97: Regression: Delete Account button enabled with GDPR compliance (#97)
Verify: Regression: Delete Account button enabled with GDPR compliance (#97)

### VR.97: Regression: fix for #97
Verify: Regression: fix for #97

### VR.96: Regression: Configure Digest dialog implemented on rollup page (#96)
Verify: Regression: Configure Digest dialog implemented on rollup page (#96)

### VR.96: Regression: fix for #96
Verify: Regression: fix for #96

### VR.95: Regression: ENCRYPTION_KEY validated at startup in health check (#95)
Verify: Regression: ENCRYPTION_KEY validated at startup in health check (#95)

### VR.95: Regression: fix for #95
Verify: Regression: fix for #95

### VR.94: Regression: deploy-local.sh port mapping matches Dockerfile EXPOSE (#94)
Verify: Regression: deploy-local.sh port mapping matches Dockerfile EXPOSE (#94)

### VR.94: Regression: fix for #94
Verify: Regression: fix for #94

### VR.93: Regression: Email body parsing for unsubscribe links when List-Unsubscribe header missing
Verify: Regression: Email body parsing for unsubscribe links when List-Unsubscribe header missing

### VR.93: Regression: fix for #93
Verify: Regression: fix for #93

### VR.91: Regression: Google Limited Use disclosure added (#91)
Verify: Regression: Google Limited Use disclosure added (#91)

### VR.91: Regression: fix for #91
Verify: Regression: fix for #91

### VR.90: Regression: GDPR data export endpoint enabled (#90)
Verify: Regression: GDPR data export endpoint enabled (#90)

### VR.90: Regression: fix for #90
Verify: Regression: fix for #90

### VR.89: Regression: GDPR-compliant privacy policy page at /privacy (#89)
Verify: Regression: GDPR-compliant privacy policy page at /privacy (#89)

### VR.89: Regression: fix for #89
Verify: Regression: fix for #89

### VR.88: Regression: fix for #88
Verify: Regression: fix for #88

### VR.87: Regression: Rollup supports three delivery time slots (morning/afternoon/evening)
Verify: Regression: Rollup supports three delivery time slots (morning/afternoon/evening)

### VR.87: Regression: fix for #87
Verify: Regression: fix for #87

### VR.85: Regression: Spec Section 18 documents all Prisma schema fields and tables
Verify: Regression: Spec Section 18 documents all Prisma schema fields and tables

### VR.85: Regression: fix for #85
Verify: Regression: fix for #85

### VR.84: Regression: Spec documents manual scan approach for email monitoring (#84)
Verify: Regression: Spec documents manual scan approach for email monitoring (#84)

### VR.84: Regression: fix for #84
Verify: Regression: fix for #84

### VR.83: Regression: BullMQ + Redis job queue system matches spec (#83)
Verify: Regression: BullMQ + Redis job queue system matches spec (#83)

### VR.83: Regression: fix for #83
Verify: Regression: fix for #83

### VR.82: Regression: NEXTAUTH_URL validation added to prevent production domain in dev (#82)
Verify: Regression: NEXTAUTH_URL validation added to prevent production domain in dev (#82)

### VR.82: Regression: fix for #82
Verify: Regression: fix for #82

### VR.81: Regression: Lazydave config port 3000 for prunebox (not 8080)
Verify: Regression: Lazydave config port 3000 for prunebox (not 8080)

### VR.81: Regression: fix for #81
Verify: Regression: fix for #81

### VR.71: Regression: Prisma upgraded to v7.7.0 with correct dependencies
Verify: Regression: Prisma upgraded to v7.7.0 with correct dependencies

### VR.71: Regression: fix for #71
Verify: Regression: fix for #71

### VR.69: Regression: fix for #69
Verify: Regression: fix for #69

### VR.55: Regression: Test framework and test coverage added (#55)
Verify: Regression: Test framework and test coverage added (#55)

### VR.55: Regression: fix for #55
Verify: Regression: fix for #55

### VR.118: Regression: UnsubscriptionAttempt and BulkDeletionJob cascade on User deletion (#118)
Verify: Regression: UnsubscriptionAttempt and BulkDeletionJob cascade on User deletion (#118)

### VR.118: Regression: fix for #118
Verify: Regression: fix for #118

### VR.117: Regression: ThemeToggle added to rollup and settings pages (#117)
Verify: Regression: ThemeToggle added to rollup and settings pages (#117)

### VR.117: Regression: fix for #117
Verify: Regression: fix for #117

### VR.V15: Regression: Dashboard page renders correctly with authentication flow
Verify: Regression: Dashboard page renders correctly with authentication flow

### VR.123: Regression: Account delete endpoint performs proper cascade deletion including SignOut call (#23)
Verify: Regression: Account delete endpoint performs proper cascade deletion including SignOut call (#23)

### VR.118: Regression: UnsubscriptionAttempt has proper cascade relation for complete GDPR compliance (#118)
Verify: Regression: UnsubscriptionAttempt has proper cascade relation for complete GDPR compliance (#118)

### V21: Regression: Bulk action API endpoint handles delete, unsubscribe, and rollup for multiple subscriptions
Verify: Regression: Bulk action API endpoint handles delete, unsubscribe, and rollup for multiple subscriptions

## rollup
### V39: Rollup digest job generates and sends daily digest email
Verify src/modules/queues/jobs.ts exports runRollupDigest() function that compiles subscriptions, generates digest content, and calls sendEmail(); check function handles delivery slot timing and timezone conversion

## subscriptions
### V14: Unsubscribe module exists
Verify src/modules/gmail/unsubscribe.ts contains unsubscribe logic

### V19: Gmail detection module implements subscription detection with confidence scoring
Verify src/modules/gmail/detection.ts exists with detectSubscription function that checks List-Unsubscribe header, List-Id, Precedence headers, sender patterns (57 patterns), domain patterns (18 ESPs), and returns confidence score 0-100

## testing
### V35: Test suite runs successfully with passing tests
Run npm test and verify all tests pass without errors; check vitest test files in src/lib/__tests__ and src/modules/gmail/__tests__ execute correctly

## webhook
### V10: Gmail webhook endpoint exists
Verify src/app/api/webhook/gmail/route.ts exists for push notifications

### V44: Gmail webhook endpoint implements HMAC SHA256 signature verification with timing-safe comparison
Verify src/app/api/webhook/gmail/route.ts contains verifyWebhookSignature() function that uses crypto.createHmac('sha256') with crypto.timingSafeEqual() for constant-time comparison; verify endpoint returns 401 when signature validation fails

