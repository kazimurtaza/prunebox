# 🔐 OAuth Token Encryption

## Security Overview

**CRITICAL SECURITY FEATURE:** All OAuth tokens (access_token, refresh_token) are encrypted at rest using **AES-256-GCM** encryption.

---

## What This Protects Against

| Threat | Protection |
|--------|-------------|
| **Database Breach** | Tokens are encrypted, not plain text |
| **Database Backup Exposure** | Encrypted tokens in backups |
| **Insider Access** | DB admins cannot read tokens |
| **Logs/Debug Output** | Middleware protects tokens |
| **Memory Dumps** | Tokens only decrypted in memory, not at rest |

---

## Encryption Details

### Algorithm: AES-256-GCM (Galois/Counter Mode)

| Property | Value |
|----------|-------|
| **Algorithm** | AES-256-GCM (NIST approved) |
| **Key Size** | 256 bits |
| **Mode** | GCM (Authenticated Encryption) |
| **Key Derivation** | PBKDF2-SHA256, 100,000 iterations |
| **IV Length** | 16 bytes (unique per encryption) |
| **Salt Length** | 64 bytes (unique per encryption) |
| **Auth Tag** | 16 bytes (prevents tampering) |

### Why AES-256-GCM?

- ✅ **Authenticated Encryption**: Detects any tampering with encrypted data
- ✅ **Industry Standard**: Used by TLS 1.3, password managers
- ✅ **Built-in**: Node.js `crypto` module (no external dependencies)
- ✅ **Performance**: Hardware-accelerated on modern CPUs

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  OAuth Callback (Google returns tokens)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ▼ NextAuth saves to Account model                          │
│                                                             │
│  Prisma Middleware (AUTOMATIC)                               │
│  ├─ Detects: access_token, refresh_token                    │
│  ├─ Encrypts using AES-256-GCM before DB write             │
│  └─ Decrypts after DB read, transparent to app              │
│                                                             │
│  ▼ Database Storage                                          │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ access_token:  <base64 encrypted blob>               │   │
│  │ refresh_token: <base64 encrypted blob>               │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Encrypted Token Format

```
<salt(64 bytes)><iv(16 bytes)><authTag(16 bytes)><ciphertext>
```

All components are:
- **Unique per encryption** (random salt + IV)
- **Required for decryption** (all must match)
- **Base64 encoded** for database storage

---

## Configuration

### Required Environment Variable

```bash
# Generate a secure key:
openssl rand -base64 48

ENCRYPTION_KEY="<your-48-character-key>"
```

**⚠️ CRITICAL:**
- Never commit `ENCRYPTION_KEY` to version control
- Never share `ENCRYPTION_KEY` publicly
- Generate a new key for each environment
- Keep backups of old keys before rotation

---

## Deployment Checklist

### Initial Deployment

- [ ] Generate `ENCRYPTION_KEY` using `openssl rand -base64 48`
- [ ] Set `ENCRYPTION_KEY` in environment variables
- [ ] Run migration: `npm run migrate:encrypt-tokens`
- [ ] Verify migration completed successfully
- [ ] Restart application

### Existing Installation (This Environment)

- [x] **Migration completed**: 2 accounts encrypted
- [x] Server restarted with encryption middleware
- [x] Worker restarted with encryption middleware
- [ ] Test login flow to verify new tokens are encrypted

---

## Encryption Status

### Current Status: ✅ **ACTIVE**

| Metric | Value |
|--------|-------|
| **Encrypted Accounts** | 2/2 (100%) |
| **Encryption Algorithm** | AES-256-GCM |
| **Middleware Status** | Active |
| **Migration Date** | 2026-03-03 |

### Verify Encryption

To verify tokens are encrypted:

```sql
SELECT id, provider, access_token, refresh_token
FROM "Account"
LIMIT 1;
```

**Encrypted tokens look like:**
```
dGhpc2lzYXJhbmRvbWJhc2U2NHNhbHRjb21iaW5lZGF0YXV0aHRhZw...
```

**Plain text tokens look like:**
```
ya29.a0AfB6x...
```

---

## Key Rotation Procedure

If you need to change `ENCRYPTION_KEY`:

### ⚠️ WARNING: Key Rotation is Critical

1. **Backup your database** - Required before any key changes
2. **Create rotation script** - Decrypt with old, encrypt with new
3. **Update ENCRYPTION_KEY** - Set new value in environment
4. **Run rotation script** - Re-encrypt all tokens
5. **Verify** - Test login flow
6. **Keep old key** - Until verification is complete

### Rotation Script Template

```typescript
import { PrismaClient } from '@prisma/client';
import { decrypt, encrypt } from './crypto';

async function rotateKeys() {
  const prisma = new PrismaClient();

  const accounts = await prisma.account.findMany({
    where: {
      provider: 'google',
      access_token: { not: null }
    }
  });

  for (const account of accounts) {
    // Decrypt with OLD key (temporarily revert code)
    const decrypted = decrypt(account.access_token);

    // Encrypt with NEW key (current code)
    const encrypted = encrypt(decrypted);

    await prisma.account.update({
      where: { id: account.id },
      data: { access_token: encrypted }
    });
  }
}
```

---

## Security Best Practices

### ✅ DO:

- Generate encryption key with `openssl rand -base64 48`
- Store `ENCRYPTION_KEY` in secure environment variables
- Rotate keys annually or after security incidents
- Backup database before any key changes
- Use different keys per environment (dev, staging, prod)

### ❌ DON'T:

- Commit `ENCRYPTION_KEY` to git
- Share `ENCRYPTION_KEY` in chat/Slack/email
- Use weak/predictable keys
- Change key without proper migration
- Lose your encryption key (tokens become unreadable)

---

## Compliance Notes

This encryption helps with:

| Regulation | Requirement | Status |
|------------|-------------|--------|
| **GDPR** | Encryption of personal data | ✅ Token encryption |
| **SOC 2** | Data at rest encryption | ✅ AES-256-GCM |
| **PCI DSS** | Key management | ⚠️ Rotate keys annually |

---

## Troubleshooting

### Issue: `Error: ENCRYPTION_KEY is not set`

**Solution:**
```bash
# Generate key
openssl rand -base64 48

# Add to .env
ENCRYPTION_KEY="<generated-key>"
```

### Issue: Tokens returning as encrypted strings

**Solution:** This means middleware is double-encrypting. Check:
- Migration was run only once
- Not manually calling `encrypt()` in application code
- Middleware is correctly configured

### Issue: `Error: Authentication failed` after deployment

**Solution:**
- Verify `ENCRYPTION_KEY` matches between environments
- Check migration completed successfully
- Ensure tokens weren't encrypted with different key

---

## Technical Implementation

### Files Modified

| File | Purpose |
|------|---------|
| `src/lib/crypto.ts` | Encryption/decryption utilities |
| `src/lib/db.ts` | Prisma middleware for auto-encrypt/decrypt |
| `scripts/migrate-encrypt-tokens.ts` | Migration script for existing tokens |

### Middleware Coverage

All Prisma Account operations are covered:
- ✅ `create()`
- ✅ `createMany()`
- ✅ `update()`
- ✅ `upsert()`
- ✅ `findMany()`
- ✅ `findFirst()`
- ✅ `findUnique()`
- ✅ `findUniqueOrThrow()`

### No Code Changes Required

The middleware is **transparent** to application code:

```typescript
// This works exactly as before - no changes needed!
const account = await db.account.findFirst({
  where: { provider: 'google', userId }
});

// Tokens are automatically decrypted when read
console.log(account.access_token); // Plain text!

// Tokens are automatically encrypted when saved
await db.account.update({
  where: { id },
  data: { access_token: newToken } // Auto-encrypted!
});
```

---

## Support

For issues or questions about token encryption:
1. Check server logs for error messages
2. Verify `ENCRYPTION_KEY` is set correctly
3. Ensure migration was run successfully
4. Test with a fresh Google OAuth connection
