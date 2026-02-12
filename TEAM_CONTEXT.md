# Prunebox Agent Team Context

## Project Overview

**Prunebox** is a privacy-first Gmail subscription management SaaS - a better alternative to Unroll.me that actually unsubscribes users (not just filtering emails) and offers bulk deletion capabilities.

### Repository
- **GitHub**: https://github.com/kazimurtaza/prunebox
- **Local Path**: /home/murtaza/projects/prunebox
- **Branch**: master

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Job Queue**: BullMQ with Redis
- **Auth**: NextAuth.js v5 (Google OAuth)
- **Email API**: Gmail API with googleapis

### Key Features
1. **True Unsubscription**: Actually unsubscribes from mailing lists using RFC 8058 one-click unsubscribe
2. **Rollup Digests**: Consolidate multiple subscriptions into daily/weekly digests
3. **Bulk Deletion**: Delete thousands of emails from specific senders
4. **Privacy First**: No data selling, no ads, transparent practices

## Project Structure

### Backend Areas
```
src/app/api/
├── auth/[...nextauth]/route.ts    # NextAuth configuration
├── subscriptions/
│   ├── route.ts                    # CRUD operations
│   ├── bulk/route.ts               # Bulk deletion
│   └── action/route.ts             # Unsubscribe actions
├── scan/
│   ├── route.ts                    # Initiate scan
│   └── status/route.ts             # Scan progress
└── webhook/gmail/route.ts          # Gmail push notifications

src/modules/
├── auth/                           # NextAuth.js v5 setup
├── gmail/
│   ├── client.ts                   # Gmail API client
│   ├── detection.ts                # Subscription detection algorithms
│   └── unsubscribe.ts              # Unsubscribe logic
├── queues/
│   ├── client.ts                   # BullMQ setup
│   └── workers.ts                  # Background job workers
└── subscriptions/                  # Business logic

prisma/
├── schema.prisma                   # Database schema
└── seed.ts                         # Seed data
```

### Frontend Areas
```
src/app/
├── page.tsx                        # Landing page
├── dashboard/
│   ├── page.tsx                    # Main dashboard
│   ├── layout.tsx                  # Dashboard layout
│   ├── settings/page.tsx           # User settings
│   └── rollup/page.tsx             # Rollup configuration
├── auth/
│   ├── signin/page.tsx
│   ├── callback/page.tsx
│   └── error/page.tsx
└── how-it-works/page.tsx

src/components/
├── dashboard/                      # Dashboard-specific components
│   └── scan-button.tsx
├── subscriptions/                  # Subscription management components
│   └── subscription-list.tsx
└── ui/                             # shadcn/ui components
    ├── button.tsx, card.tsx, etc.
```

## Database Schema

### Key Models
- **User**: User accounts with Google OAuth
- **Account**: OAuth token storage (access_token, refresh_token)
- **Subscription**: Detected email subscriptions with unsubscribe metadata
- **SubscriptionPreference**: User actions (keep, unsubscribe, rollup)
- **GmailSyncState**: Scan status and progress tracking
- **RollupSettings**: Digest configuration
- **UnsubscriptionAttempt**: Unsubscribe operation tracking
- **BulkDeletionJob**: Bulk delete job tracking

## Available Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run worker       # Run BullMQ background workers
npm run db:push      # Push Prisma schema to database
npm run db:studio    # Open Prisma Studio
npm run docker:up    # Start PostgreSQL and Redis with Docker
npm run docker:down  # Stop Docker services
```

## GitHub Issue Labels

- `backend` - Backend-only fixes/features
- `frontend` - Frontend-only fixes/features
- `backend-frontend` - Cross-cutting concerns
- `bug` - Bug report
- `enhancement` - Feature request
- `testing` - Testing improvements

## Development Workflow

1. **Manual QA Tester** finds bugs and creates issues with appropriate labels
2. **Developers** poll for labeled issues, create branches, and fix
3. **Code Reviewer** reviews and merges PRs
4. **Local Deployer** deploys changes locally
5. **Manual QA Tester** verifies fixes - cycle repeats

## Environment Variables

Required for local development (see .env.example):
- DATABASE_URL - PostgreSQL connection
- REDIS_URL - Redis connection
- NEXTAUTH_SECRET - Session encryption
- GOOGLE_CLIENT_ID - OAuth client ID
- GOOGLE_CLIENT_SECRET - OAuth client secret
- ENCRYPTION_KEY - Token encryption (32 chars)

## Gmail API Scopes

All are "Restricted" and require verification:
- `gmail.readonly` - Read email headers
- `gmail.modify` - Move emails to trash
- `gmail.labels` - Manage labels
- `gmail.send` - Send rollup digests

## Important Notes

- Without Google verification: limited to 100 test users
- Refresh tokens are critical - use `access_type: offline` and `prompt: consent`
- BullMQ workers must run separately from Next.js dev server
- Rate limits: 1,200,000 quota units/minute per project, 15,000/minute per user
