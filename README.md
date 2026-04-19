# Prunebox

**Privacy-first email cleanup and grouping tool** - a better alternative to Unroll.me.

> **Note**: This is the public repository for Prunebox. You can self-host your own instance.

## ✨ Features

- **🗑️ Bulk Deletion** - Delete thousands of emails from specific senders in seconds
- **📦 Smart Grouping** - Automatically groups emails by sender for easy management
- **📬 Rollup Digests** - Consolidate multiple subscriptions into daily/weekly digests
- **🔕 True Unsubscription** - Unsubscribe from mailing lists (for newsletters)
- **🔒 Privacy First** - No data selling, no ads, transparent practices
- **🎨 Modern UI** - Dark theme support, mobile-friendly, responsive design

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: TailwindCSS, shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Job Queue**: BullMQ + Redis for background job processing
- **Auth**: NextAuth.js v5 (Google OAuth)
- **Email API**: Gmail API with googleapis

## 🚀 Quick Start (Self-Hosted)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kazimurtaza/prunebox.git
   cd prunebox
   ```

2. **Set up environment variables:**
   ```bash
   # Option A: Use the setup script (generates secrets automatically)
   bash scripts/setup.sh

   # Option B: Manual setup
   cp .env.example .env
   # Edit .env with your values (see Configuration section)
   ```

3. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

   The app will be available at `http://localhost:3000`

   For advanced setups, see `docker-compose.production.yml` (production) and `docker-compose.dev.yml` (development).

### Option 2: Pre-built Docker Image

```bash
docker pull ghcr.io/kazimurtaza/prunebox:latest
docker run -p 3000:3000 --env-file .env ghcr.io/kazimurtaza/prunebox:latest
```

### Option 3: Build from Source

**Prerequisites:**
- Node.js 18+
- PostgreSQL 14+
- Redis 7+ (for background job queue)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env — set DATABASE_URL and OAuth credentials (see Configuration below)

# 3. Set up the database
npx prisma migrate deploy

# 4. Build
npm run build

# 5. Start the application
npm start
```

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://prunebox:password@localhost:5432/prunebox` |
| `POSTGRES_PASSWORD` | Database password | `random-32-char-string` |
| `REDIS_URL` | Redis connection string for job queue | `redis://localhost:6379` |
| `NEXTAUTH_URL` | Your app's public URL | `https://prunebox.example.com` |
| `NEXTAUTH_SECRET` | NextAuth session secret | `random-32-char-string` |
| `ENCRYPTION_KEY` | Encrypts OAuth tokens in DB | `32-character-encryption-key` |
| `GMAIL_WEBHOOK_SECRET` | Gmail webhook verification | `random-64-char-string` |

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Gmail API**
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback` (dev)
   - `https://yourdomain.com/api/auth/callback` (prod)
6. Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

#### OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services > OAuth consent screen**
2. Set **User Type** to **External** (unless you have a Google Workspace)
3. Fill in the required app information (app name, user support email, developer contact email)
4. Under **Scopes**, add the following (they should appear automatically when users sign in):
   - `gmail.readonly`
   - `gmail.modify`
   - `gmail.labels`
   - `gmail.send`
   - `openid` (added automatically by NextAuth)
   - `email` and `profile` (added automatically by NextAuth)
5. Click **Save and Continue** through each step

#### Adding Test Users

If your app is not verified, you must add test users before they can sign in:

1. Go to **APIs & Services > OAuth consent screen > Test users**
2. Click **Add Users** and enter the Gmail addresses of users who need access
3. Test users will see an "Unverified App" warning but can proceed by clicking **Advanced > Go to (your app)**

#### Publishing Your App

Unverified apps are limited to **100 test users**. To allow anyone to sign up:

1. Go through Google's [OAuth app verification process](https://support.google.com/cloud/answer/9110914)
2. You'll need to complete a verification assessment, including:
   - A privacy policy URL
   - A terms of service URL
   - Justification for each sensitive scope requested
3. Once verified, the "Unverified App" screen is removed and any Google user can sign in

#### Google Verification Timeline and Costs

Before deploying to production, be aware that Gmail API scopes are "Restricted" and require Google's verification process:

| Phase | Duration |
|-------|----------|
| Brand verification (domain, privacy policy) | 2-3 business days |
| Initial OAuth scope review | 1-4 weeks |
| CASA Tier 2 security assessment | 1-3 weeks |
| **Total minimum** | **4-8 weeks** |
| With issues/remediation | **3-6 months** |

**CASA audit costs** (annual):
- Tier 2 (most apps): $500-1,000/year
- Tier 3 (if required): $4,500+/year
- Annual recertification mandatory every 12 months

**Without verification:**
- Limited to 100 test users
- "Unverified app" warning shown to users
- Refresh tokens expire after 7 days
- Cannot operate in production

Plan accordingly for your deployment timeline.

### Gmail API Scopes

This app uses the following Gmail scopes (all are "Restricted" and require verification):

- `gmail.readonly` - Read email headers for subscription detection
- `gmail.modify` - Move emails, apply labels, trash messages
- `gmail.labels` - Create/manage subscription labels
- `gmail.send` - Send rollup digest emails

> **Warning**: Without Google verification, the app is limited to 100 test users and will show "Unverified App" warnings.

## 🐳 Docker Images

| Tag | Description |
|-----|-------------|
| `:latest` | Latest production build (from master branch) |
| `:develop` | Development build (from develop branch) |
| `:vX.Y.Z` | Versioned releases |

Pull from `ghcr.io/kazimurtaza/prunebox`

## 🌐 Reverse Proxy (Optional)

### Nginx Example

```nginx
server {
    listen 80;
    server_name prunebox.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Traefik Example

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.prunebox.rule=Host(`prunebox.example.com`)"
  - "traefik.http.routers.prunebox.tls=true"
  - "traefik.http.routers.prunebox.tls.certresolver=letsencrypt"
```

## 📊 Database Schema

The app uses Prisma ORM with PostgreSQL. Schema includes:
- Users (OAuth accounts)
- Subscriptions (email groups per sender)
- Email messages (metadata only, no content stored)
- Rollup digests
- Webhook subscriptions

Run migrations:
```bash
npx prisma migrate deploy
```

## 🔒 Privacy Policy

We do not sell, rent, or share your data with third parties. Your email content is used only to provide the subscription management service. You can request complete data deletion at any time.

## 📝 License

Copyright © 2026 Prunebox. All rights reserved.

---

**Built with** ❤️ **for privacy-conscious email users**
