# Prunebox

Privacy-first Gmail subscription management SaaS - a better alternative to Unroll.me.

## Features

- **True Unsubscription**: Actually unsubscribes you from mailing lists (not just filtering)
- **Rollup Digests**: Consolidate multiple subscriptions into daily/weekly digests
- **Bulk Deletion**: Delete thousands of emails from specific senders
- **Privacy First**: No data selling, no ads, transparent practices

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: TailwindCSS, shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Job Queue**: BullMQ with Redis
- **Auth**: NextAuth.js v5 (Google OAuth)
- **Email API**: Gmail API with googleapis

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Redis server

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd prunebox
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `ENCRYPTION_KEY` - 32-character encryption key for tokens

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

6. Visit `http://localhost:3000`

## Development

### Running Background Workers

The job workers (email scanning, unsubscription, rollup digests) need to run as separate processes.

To run workers in development:
```bash
# Start workers
npm run worker
```

### Database Management

```bash
# Open Prisma Studio
npm run db:studio

# Push schema changes
npm run db:push

# Seed database
npm run db:seed
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback`
6. Copy Client ID and Client Secret to `.env`

## Gmail API Scopes

This application uses the following Gmail scopes (all are "Restricted" and require verification):

- `gmail.readonly` - Read email headers for subscription detection
- `gmail.modify` - Move emails, apply labels, trash messages
- `gmail.labels` - Create/manage subscription labels
- `gmail.send` - Send rollup digest emails

**Note**: Without Google verification, the app is limited to 100 test users and will show "Unverified App" warnings.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Main application
├── components/
│   ├── subscriptions/     # Subscription components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility functions
├── modules/
│   ├── auth/              # NextAuth configuration
│   ├── gmail/             # Gmail API client & detection
│   ├── queues/            # BullMQ job queues
│   └── subscriptions/     # Subscription logic
└── prisma/                # Database schema and migrations
```

## License

MIT

## Privacy Policy

We do not sell, rent, or share your data with third parties. Your email content is used only to provide the subscription management service. You can request complete data deletion at any time.
