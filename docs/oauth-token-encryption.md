# OAuth Token Encryption at Rest

This document describes how OAuth access tokens and refresh tokens are encrypted at rest in Prunebox.

## Overview

OAuth tokens (access tokens and refresh tokens) are **automatically encrypted** when stored in the database and **automatically decrypted** when retrieved. This is handled transparently by a Prisma middleware layer - no manual encryption/decryption calls are needed in application code.

### Security Benefits

- **AES-256-GCM encryption**: Industry-standard authenticated encryption
- **PBKDF2 key derivation**: 100,000 iterations with SHA-256
- **Unique IV per encryption**: Each token gets a random initialization vector
- **Auth tags**: Tamper detection for encrypted data
- **Transparent to application**: Middleware handles everything automatically

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   NextAuth   │  │ Token Refresh│  │      Workers         │  │
│  │   (OAuth)    │  │  (Gmail API) │  │  (Background Jobs)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┴──────────────────────┘              │
│                           │                                     │
│                           ▼                                     │
│                  ┌─────────────────┐                            │
│                  │ Extended `db`   │                            │
│                  │   (Prisma +     │                            │
│                  │   Middleware)   │                            │
│                  └────────┬────────┘                            │
└───────────────────────────┼────────────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │     Prisma Middleware         │
            │  ┌─────────────────────────┐  │
            │  │  WRITE → ENCRYPT        │  │
            │  │  READ  → DECRYPT        │  │
            │  └─────────────────────────┘  │
            └───────────────┬───────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │   Database      │
                  │  (PostgreSQL)   │
                  │                 │
                  │  account table: │
                  │  - access_token │  ← Encrypted at rest
                  │  - refresh_token│  ← Encrypted at rest
                  └─────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | Prisma client with encryption middleware |
| `src/lib/crypto.ts` | AES-256-GCM encryption/decryption functions |
| `scripts/migrate-encrypt-tokens.ts` | One-time migration script for existing tokens |

---

## Encryption Implementation

### Algorithm Details

**src/lib/crypto.ts**

```typescript
// Encryption algorithm
ALGORITHM = 'aes-256-gcm'

// Key derivation
PBKDF2-SHA256 with 100,000 iterations

// Output format
Base64(salt:64bytes + iv:16bytes + authTag:16bytes + ciphertext)
```

### Encryption Function

```typescript
export function encrypt(plaintext: string): string {
  // 1. Generate random salt and IV
  const salt = crypto.randomBytes(64);
  const iv = crypto.randomBytes(16);

  // 2. Derive key using PBKDF2
  const key = crypto.pbkdf2Sync(
    process.env.ENCRYPTION_KEY!,
    salt,
    100000,  // iterations
    32,      // key length for AES-256
    'sha256'
  );

  // 3. Encrypt with AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'binary');
  encrypted += cipher.final('binary');

  // 4. Get auth tag for tamper detection
  const authTag = cipher.getAuthTag();

  // 5. Combine: salt + iv + authTag + encrypted
  const combined = Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'binary')]);

  return combined.toString('base64');
}
```

### Decryption Function

```typescript
export function decrypt(ciphertext: string): string {
  // 1. Decode base64
  const combined = Buffer.from(ciphertext, 'base64');

  // 2. Extract components
  const salt = combined.subarray(0, 64);    // Salt
  const iv = combined.subarray(64, 80);     // IV
  const authTag = combined.subarray(80, 96); // Auth tag
  const encrypted = combined.subarray(96);   // Ciphertext

  // 3. Derive same key using salt
  const key = crypto.pbkdf2Sync(
    process.env.ENCRYPTION_KEY!,
    salt,
    100000,
    32,
    'sha256'
  );

  // 4. Decrypt with auth tag verification
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, 'binary');
  decrypted += decipher.final('binary');

  return decrypted;
}
```

---

## Prisma Middleware

The middleware intercepts all `account` model queries to automatically encrypt/decrypt tokens.

**src/lib/db.ts**

### Write Operations (Encryption)

| Operation | Lines | Behavior |
|-----------|-------|----------|
| `create()` | 23-32 | Encrypts `access_token`, `refresh_token` before insert |
| `createMany()` | 35-46 | Encrypts tokens in batch operations |
| `update()` | 49-58 | Encrypts tokens being updated |
| `upsert()` | 61-78 | Encrypts tokens in both create and update branches |

### Read Operations (Decryption)

| Operation | Lines | Behavior |
|-----------|-------|----------|
| `findMany()` | 82-94 | Decrypts tokens in all results |
| `findFirst()` | 97-107 | Decrypts tokens in single result |
| `findUnique()` | 110-120 | Decrypts tokens in single result |
| `findUniqueOrThrow()` | 123-133 | Decrypts tokens in single result |

### Example Middleware Code

```typescript
return basePrisma.$extends({
  name: 'encryptionMiddleware',
  query: {
    account: {
      // Encrypt on write
      async create({ args, query }) {
        if (args.data) {
          if (args.data.access_token) {
            args.data.access_token = encrypt(args.data.access_token);
          }
          if (args.data.refresh_token) {
            args.data.refresh_token = encrypt(args.data.refresh_token);
          }
        }
        return query(args);
      },

      // Decrypt on read
      async findFirst({ args, query }) {
        const result = await query(args);
        if (result) {
          if (result.access_token) {
            result.access_token = decrypt(result.access_token);
          }
          if (result.refresh_token) {
            result.refresh_token = decrypt(result.refresh_token);
          }
        }
        return result;
      },
      // ... other operations
    },
  },
}) as PrismaClient;
```

---

## Usage Throughout Application

All application code uses the extended `db` client from `src/lib/db.ts`. The middleware is transparent - no code changes needed.

### 1. NextAuth OAuth Token Saves

**src/modules/auth/auth.ts**

```typescript
import { db } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),  // ← Extended client
  // ...
});
```

When NextAuth saves tokens via `PrismaAdapter`:
- Calls `db.account.create()` internally
- Middleware **automatically encrypts** tokens
- No manual encryption needed

### 2. Token Refresh (Gmail API)

**src/modules/gmail/client.ts**

```typescript
// Import extended db dynamically (avoids circular deps)
const { db } = await import('@/lib/db');

// Read - tokens auto-decrypted by middleware
const account = await db.account.findFirst({
  where: { userId, provider: 'google' },
});

// Write - tokens auto-encrypted by middleware
await db.account.update({
  where: { id: account.id },
  data: {
    access_token: newAccessToken,      // ← Auto-encrypted
    refresh_token: newRefreshToken,    // ← Auto-encrypted
  },
});
```

### 3. Worker Token Fetches

**src/modules/queues/workers.ts**

```typescript
import { db } from '@/lib/db';

// Tokens are auto-decrypted when read from DB
const account = await db.account.findFirst({
  where: { userId, provider: 'google' },
});

// Use decrypted tokens directly
const gmail = await createGmailClient(
  account.access_token,   // ← Already decrypted
  account.refresh_token   // ← Already decrypted
);
```

### 4. API Routes

All API routes use the extended `db` client:

```typescript
import { db } from '@/lib/db';

// Any token read from db.account is automatically decrypted
const account = await db.account.findFirst({ ... });
```

---

## Security Checklist

| Aspect | Status | Implementation |
|--------|--------|----------------|
| Encryption Algorithm | ✅ | AES-256-GCM |
| Key Derivation | ✅ | PBKDF2-SHA256, 100,000 iterations |
| Unique IV per encryption | ✅ | `crypto.randomBytes(16)` |
| Auth Tags (tamper detection) | ✅ | `cipher.getAuthTag()` |
| All write operations covered | ✅ | create, createMany, update, upsert |
| All read operations covered | ✅ | findMany, findFirst, findUnique, findUniqueOrThrow |
| No application bypasses | ✅ | All code uses extended `db` client |
| NextAuth integration | ✅ | PrismaAdapter uses extended client |
| Token refresh encryption | ✅ | Middleware handles automatically |
| Worker token decryption | ✅ | Middleware handles automatically |

---

## Environment Variables

### Required

```bash
# Encryption key for OAuth tokens (generate with: openssl rand -base64 48)
ENCRYPTION_KEY=your-base64-encoded-key-here
```

### Key Generation

```bash
# Generate a secure encryption key
openssl rand -base64 48
```

---

## Migration

For existing databases with plain text tokens, use the migration script:

```bash
npm run migrate:encrypt-tokens
```

This script:
1. Finds all accounts with plain text tokens
2. Encrypts them using the current `ENCRYPTION_KEY`
3. Updates the database with encrypted values

**Note**: The migration script uses raw `PrismaClient` to bypass the middleware (intentional, one-time operation).

---

## Verification

All code paths have been verified to use the extended `db` client:

| Location | Uses Extended `db` |
|----------|-------------------|
| Workers (`src/modules/queues/workers.ts`) | ✅ |
| Gmail Client (`src/modules/gmail/client.ts`) | ✅ |
| API Routes (all) | ✅ |
| NextAuth (`src/modules/auth/auth.ts`) | ✅ |

Only raw `new PrismaClient()` usage is in:
- `scripts/migrate-encrypt-tokens.ts` - Intentional, one-time migration
- `prisma/seed.ts` - Development/testing only

---

## Troubleshooting

### Tokens appear as encrypted strings in logs

This is expected behavior. Tokens are encrypted at rest in the database. When read via the extended `db` client, they are automatically decrypted before being returned to your application code.

### `ENCRYPTION_KEY not set` error

Ensure the `ENCRYPTION_KEY` environment variable is set:

```bash
# .env
ENCRYPTION_KEY=your-base64-encoded-key-here
```

### Migration script fails

1. Verify `ENCRYPTION_KEY` is set
2. Ensure database is accessible
3. Check database migrations are up to date: `npx prisma migrate deploy`

---

## References

- [RFC 2369 - The List-Unsubscribe Header](https://datatracker.ietf.org/doc/html/rfc2369)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [Prisma Middleware](https://www.prisma.io/docs/concepts/components/prisma-client/middleware)
- [AES-GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [PBKDF2](https://en.wikipedia.org/wiki/PBKDF2)
