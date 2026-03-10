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
- **Job Queue**: BullMQ with Redis
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
   cp .env.example .env
   # Edit .env with your values (see Configuration section)
   ```

3. **Generate encryption keys:**
   ```bash
   # Generate POSTGRES_PASSWORD
   openssl rand -base64 32

   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32

   # Generate ENCRYPTION_KEY (for OAuth tokens)
   openssl rand -base64 48

   # Generate GMAIL_WEBHOOK_SECRET
   openssl rand -base64 64
   ```

4. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

   The app will be available at `http://localhost:3000`

### Option 2: Pre-built Docker Image

```bash
docker pull ghcr.io/kazimurtaza/prunebox:latest
docker run -p 3000:3000 --env-file .env ghcr.io/kazimurtaza/prunebox:latest
```

### Option 3: Build from Source

```bash
npm install
npm run build:worker
npm run build:next
npm start
```

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://prunebox:password@localhost:5432/prunebox` |
| `POSTGRES_PASSWORD` | Database password | `random-32-char-string` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
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
