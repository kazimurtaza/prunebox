# Prunebox Production Deployment Guide

## Quick Start

### Option 1: Use Pre-built Image (Recommended)

1. **Copy `docker-compose.production.yml`** to your server
2. **Edit the file** and replace all `CHANGE_THIS_*` values with your actual secrets
3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

### Option 2: Build from Source

```bash
git clone https://github.com/kazimurtaza/prunebox.git
cd prunebox
docker-compose -f docker-compose.production.yml up -d
```

## Required Secrets

Generate these before deploying:

```bash
# NextAuth secret
openssl rand -base64 32

# Encryption key (for OAuth tokens)
openssl rand -base64 48

# Webhook secret
openssl rand -base64 32

# PostgreSQL password
openssl rand -base64 16
```

## Google OAuth Setup

> **Important:** Gmail API scopes are "Restricted" and require Google's OAuth verification process before production use. This takes 4-8 weeks minimum and may require a CASA security audit ($500-1,000/year). See README.md for details.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `https://yourdomain.com/api/auth/callback`
6. Copy Client ID and Secret to docker-compose file

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://prunebox:pass@localhost:5432/prunebox` |
| `POSTGRES_PASSWORD` | PostgreSQL password | Strong random string |
| `NEXTAUTH_URL` | NextAuth URL | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | NextAuth secret | Strong random string |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `GOCSPX-xxx` |
| `ENCRYPTION_KEY` | Token encryption key | Strong random string (48 chars) |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://yourdomain.com` |
| `GMAIL_WEBHOOK_SECRET` | Webhook signature | Strong random string |

## Health Check

After deployment, check if the service is running:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{"status":"healthy","database":"connected"}
```

## Logs

View logs:
```bash
docker logs -f prunebox
```

## Troubleshooting

### Container not starting?
```bash
docker logs prunebox
```

### Health check failing?
```bash
docker logs prunebox | grep -i error
```

### Database connection issues?
```bash
# Check if PostgreSQL is running in the container
docker exec prunebox pg_isready -U prunebox
```

### Need to reset everything?
```bash
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d
```

## Reverse Proxy Configuration

### nginx

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;
}
```

### traefik

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.prunebox.rule=Host(`yourdomain.com`)"
  - "traefik.http.services.prunebox.loadbalancer.server.port=3000"
```

## Backup and Restore

### Backup Database
```bash
docker exec prunebox pg_dump -U prunebox prunebox > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker exec -i prunebox psql -U prunebox prunebox
```

## Updating

To update to the latest version:

```bash
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

## Support

For issues or questions:
- GitHub: https://github.com/kazimurtaza/prunebox
- Documentation: See `/docs` folder in the repository
