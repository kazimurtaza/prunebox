# Google OAuth Quick Start for Prunebox

## The 60-Second Overview

You need Google OAuth credentials for Prunebox to work. Here's what to do:

1. **Go to** [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a project** (or use existing)
3. **Enable Gmail API** (APIs & Services > Library)
4. **Set up OAuth consent screen** with these scopes:
   - `openid`
   - `email`
   - `profile`
   - `gmail.readonly`
   - `gmail.modify`
   - `gmail.labels`
   - `gmail.send`
5. **Create OAuth 2.0 credentials** (Web application)
6. **Add redirect URI**: `http://localhost:3000/api/auth/callback/google`
7. **Copy credentials** to your `.env` file

## Redirect URI (Important!)

Your redirect URI **must** be exactly:
```
http://localhost:3000/api/auth/callback/google
```

Common mistakes:
- ❌ `http://localhost:3000/api/auth/callback` (missing `/google`)
- ❌ `http://localhost:3000/auth/callback/google` (missing `/api`)
- ✅ `http://localhost:3000/api/auth/callback/google` (correct!)

## .env Variables to Update

```bash
GOOGLE_CLIENT_ID="your-actual-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-actual-client-secret"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
ENCRYPTION_KEY="run: openssl rand -base64 24 | head -c32"
```

## Test User Setup

During development, add your email as a test user:
1. Go to **OAuth consent screen**
2. Click **TEST USERS**
3. Add your Gmail address

## Verify Setup

Run the setup check script:
```bash
./scripts/setup-check.sh
```

## Still Need Help?

See the full guide: [docs/GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "OAuth client was not found" | Wrong Client ID/Secret | Double-check your `.env` values |
| "redirect_uri_mismatch" | Wrong redirect URI | Ensure `/api/auth/callback/google` is in Google Console |
| "Unverified App" warning | App not verified | Click "Advanced" > "Go to Prunebox (unsafe)" |
| "Access Blocked" | Not a test user | Add your email in OAuth consent screen |

## Google Cloud Console Quick Links

- [Projects](https://console.cloud.google.com/projectcreate)
- [API Library](https://console.cloud.google.com/apis/library)
- [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
- [Credentials](https://console.cloud.google.com/apis/credentials)
