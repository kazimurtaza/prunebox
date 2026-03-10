# Prunebox vs CleanEmail - Comparative Analysis

**Last Updated:** 2026-03-08
**Status:** Active Development - Cloning CleanEmail Features

---

## Executive Summary

Prunebox is a privacy-first email subscription management service being built as an open-source alternative to CleanEmail. This document tracks feature parity and roadmap.

**Current Parity:** ~35% complete (Core infrastructure + basic subscription management)

---

## Feature Comparison Matrix

| Feature Category | CleanEmail | Prunebox | Status |
|-----------------|------------|----------|--------|
| **Authentication** | OAuth (Gmail, Outlook, etc.) | Google OAuth | ✅ Partial (Gmail only) |
| **Email Scanning** | Full inbox scan | Full inbox scan + incremental | ✅ Complete |
| **Subscription Detection** | Auto-detection | Multi-criteria detection + confidence scoring | ✅ Enhanced |
| **Bulk Actions** | Delete, Archive, Move | Delete, Unsubscribe | 🟡 Partial |
| **Unsubscribe** | One-click unsubscribe | One-click + mailto + HTTP | ✅ Complete |
| **Smart Folders** | Pre-defined categories | Not implemented | ❌ Missing |
| **Auto Clean Rules** | Custom automation rules | Not implemented | ❌ Missing |
| **Screener** | Unknown sender filter | Not implemented | ❌ Missing |
| **Rollup/Digest** | Not available | Daily digest | ✅ Complete |
| **Multi-Account** | 5-10 accounts | Single account | 🟡 Partial |
| **Email Provider Support** | Gmail, Outlook, Yahoo, iCloud, IMAP | Gmail only | 🟡 Partial |
| **Privacy** | No data selling | No data selling + open source | ✅ Enhanced |
| **Pricing** | $9.99-$29.99/mo | Free (self-hosted) | ✅ Enhanced |

---

## Detailed Feature Comparison

### ✅ COMPLETED Features

#### 1. Authentication & Account Management

| Feature | CleanEmail | Prunebox | Notes |
|---------|------------|----------|-------|
| OAuth Login | Google, Outlook, Yahoo, iCloud | Google only | Prunebox: NextAuth.js v5 |
| Token Storage | Encrypted | Encrypted | Prunebox: AES encryption |
| Session Management | Yes | JWT (30-day) | |
| Multi-Account | 5-10 accounts | Single account | Planned |

**Prunebox Implementation:**
- File: `src/modules/auth/auth.ts`
- NextAuth.js v5 with Prisma adapter
- Encrypted token storage in database
- Google OAuth with `gmail.modify` scope

#### 2. Email Scanning & Detection

| Feature | CleanEmail | Prunebox | Notes |
|---------|------------|----------|-------|
| Full Inbox Scan | Yes | Yes | |
| Incremental Sync | Yes | Yes | Prunebox: historyId tracking |
| Rate Limiting | Yes | Yes | Prunebox: 1 scan/minute |
| Detection Confidence | Not specified | 0-100% scoring | Prunebox: Enhanced |
| Detection Methods | Not specified | 6-criteria algorithm | Prunebox: Enhanced |

**Prunebox Implementation:**
- File: `src/modules/gmail/detection.ts`
- Multi-criteria detection:
  1. List-Unsubscribe header (95-100%)
  2. List-Id header (90%)
  3. Precedence header (75%)
  4. Auto-Submitted header (60%)
  5. Sender email patterns
  6. ESP domain detection

#### 3. Subscription Management

| Feature | CleanEmail | Prunebox | Notes |
|---------|------------|----------|-------|
| Group by Sender | Yes | Yes | |
| View Email Subjects | Yes | Yes | |
| Email Count | Yes | Yes | |
| First/Last Seen | Yes | Yes | |
| Confidence Score | No | Yes | Prunebox: Enhanced |
| Bulk Select | Yes | Yes | |
| Search/Filter | Yes | Yes | |

**Prunebox Implementation:**
- Component: `src/components/subscriptions/subscription-list.tsx`
- Sortable by: recent, emails, name, confidence
- Filterable by: all, high/low confidence, has unsubscribe
- Search by sender name/email
- Bulk selection with checkboxes

#### 4. Unsubscribe Features

| Feature | CleanEmail | Prunebox | Notes |
|---------|------------|----------|-------|
| One-Click Unsubscribe | Yes | Yes | |
| Mailto Unsubscribe | Yes | Yes | |
| HTTP POST Unsubscribe | Yes | Yes | |
| Manual Unsubscribe | Yes | Yes | |
| Re-subscribe | Yes | Not implemented | Planned |

**Prunebox Implementation:**
- File: `src/modules/gmail/unsubscribe.ts`
- Supports: one-click, mailto, HTTP POST, manual
- Queue-based processing with BullMQ
- Error handling and retry logic

#### 5. Rollup / Digest Feature

| Feature | CleanEmail | Prunebox | Notes |
|---------|------------|----------|-------|
| Daily Digest | No | Yes | Prunebox: Unique feature |
| Configurable Schedule | N/A | Yes | |
| Test Digest | N/A | Yes | |

**Prunebox Implementation:**
- File: `src/app/dashboard/rollup/page.tsx`
- Daily digest of rolled-up subscriptions
- Configurable delivery time
- BullMQ job scheduling

#### 6. Background Jobs

| Feature | CleanEmail | Prunebox | Notes |
|---------|------------|----------|-------|
| Queue System | Yes | Yes | Prunebox: BullMQ + Redis |
| Job Status Tracking | Yes | Yes | |
| Worker Processes | Yes | Yes | Prunebox: Configurable concurrency |

**Prunebox Implementation:**
- File: `src/modules/queues/workers.ts`
- Queues: EMAIL_SCAN, UNSUBSCRIBE, BULK_DELETE, ROLLUP
- Redis-backed job queues
- Graceful shutdown handling

#### 7. Privacy & Security

| Feature | CleanEmail | Prunebox | Notes |
|---------|------------|----------|-------|
| No Data Selling | Yes | Yes | |
| Encrypted Tokens | Yes | Yes | |
| Open Source | No | Yes | Prunebox: Enhanced |
| Self-Hostable | No | Yes | Prunebox: Enhanced |
| GDPR Export | Yes | Yes | |
| Account Deletion | Yes | Yes | |

**Prunebox Implementation:**
- No email content stored (headers only)
- Tokens encrypted at rest
- Open source code
- Self-hosted deployment

---

### 🟡 PARTIAL Features

#### 1. Bulk Actions

| Action | CleanEmail | Prunebox | Status |
|--------|------------|----------|--------|
| Delete | Yes | Yes | ✅ |
| Archive | Yes | No | ❌ |
| Move | Yes | No | ❌ |
| Label | Yes | No | ❌ |
| Mark Read | Yes | No | ❌ |

**Prunebox Gap:** Only bulk delete is implemented. Archive, move, label, and mark read actions are missing.

**Implementation Plan:**
```typescript
// Add to src/app/api/subscriptions/bulk/route.ts
export async function POST(request: Request) {
  const { subscriptionIds, action } = await request.json();

  switch (action) {
    case 'archive':
      // Move emails to archive folder
      break;
    case 'move':
      // Move to specified label/folder
      break;
    case 'label':
      // Add Gmail label
      break;
    case 'markRead':
      // Mark as read
      break;
  }
}
```

#### 2. Multi-Account Support

| Feature | CleanEmail | Prunebox | Status |
|---------|------------|----------|--------|
| Multiple Email Accounts | 5-10 | 1 | ❌ |
| Unified Dashboard | Yes | No | ❌ |
| Account Switching | Yes | No | ❌ |

**Prunebox Gap:** Only single Google account per user.

**Implementation Plan:**
- Update `Account` model to support multiple OAuth connections
- Add account selector UI
- Aggregate subscriptions across accounts
- Per-account scan controls

---

### ❌ MISSING Features

#### 1. Smart Folders / Categories

**CleanEmail:** Auto-categorizes emails into Shopping, Social, Newsletters, Travel, Finance, Marketing, Promotions, Documents

**Prunebox:** Not implemented

**Implementation Plan:**
```typescript
// Add to prisma/schema.prisma
model SmartFolder {
  id          String   @id @default(cuid())
  userId      String
  name        String   // "Shopping", "Social", etc.
  icon        String?
  color       String?
  rules       Json     // Array of categorization rules
  subscriptions Subscription[]
  user        User     @relation(fields: [userId], references: [id])

  @@unique([userId, name])
}

// Categorization service
// src/modules/gmail/categorization.ts
export function categorizeSubscription(subscription: Subscription): string[] {
  const categories = [];
  const { senderEmail, senderName } = subscription;

  // Shopping detection
  if (SHOPPING_DOMAINS.test(senderEmail)) {
    categories.push('Shopping');
  }

  // Social media detection
  if (SOCIAL_DOMAINS.test(senderEmail)) {
    categories.push('Social');
  }

  // ... more categorization logic

  return categories;
}
```

#### 2. Auto Clean Rules

**CleanEmail:** Create custom automation rules (e.g., "Auto-delete emails from X after 7 days")

**Prunebox:** Not implemented

**Implementation Plan:**
```typescript
// Add to prisma/schema.prisma
model AutoCleanRule {
  id          String   @id @default(cuid())
  userId      String
  name        String
  enabled     Boolean  @default(true)
  conditions  Json     // { sender, subject, age, etc }
  actions     Json     // { delete, archive, label, etc }
  schedule    String?  // cron expression
  lastRunAt   DateTime?
  user        User     @relation(fields: [userId], references: [id])
}

// Rule engine
// src/modules/rules/engine.ts
export async function applyRule(rule: AutoCleanRule) {
  // Match subscriptions based on conditions
  // Apply actions
  // Schedule next run
}
```

#### 3. Screener Feature

**CleanEmail:** Separate inbox for unknown senders, review before allowing in main inbox

**Prunebox:** Not implemented

**Implementation Plan:**
```typescript
// Add to prisma/schema.prisma
model ScreenerSettings {
  id              String   @id @default(cuid())
  userId          String   @unique
  enabled         Boolean  @default(true)
  blockUnknown    Boolean  @default(false)
  allowedSenders  String[] // Whitelist
  blockedSenders  String[] // Blacklist
  user            User     @relation(fields: [userId], references: [id])
}

// Screener service
// src/modules/screener/guard.ts
export async function screenIncomingMessage(message: GmailMessage): Promise<boolean> {
  // Return true if message should be allowed in inbox
  // Check whitelist/blacklist
  // Check if sender is known
}
```

#### 4. Email Provider Support

**CleanEmail:** Gmail, Outlook, Yahoo, iCloud, AOL, all IMAP/POP3

**Prunebox:** Gmail only

**Implementation Plan:**
- Add Outlook OAuth (Microsoft Identity Platform)
- Add Yahoo OAuth
- Add generic IMAP/POP3 support
- Abstract email client interface

```typescript
// src/modules/email/client-interface.ts
interface EmailClient {
  listMessages(options: ListOptions): Promise<Message[]>
  getMessage(id: string): Promise<Message>
  deleteMessages(ids: string[]): Promise<void>
  getLabels(): Promise<Label[]>
  // ... common methods
}

// src/modules/email/gmail-client.ts
// src/modules/email/outlook-client.ts
// src/modules/email/imap-client.ts
```

#### 5. Cleaning Suggestions

**CleanEmail:** Proactive recommendations based on user habits and community patterns

**Prunebox:** Not implemented

**Implementation Plan:**
```typescript
// src/modules/suggestions/analyzer.ts
export async function generateSuggestions(userId: string) {
  const suggestions = [];

  // Suggest unsubscribe from low-activity subscriptions
  // Suggest delete old emails from certain senders
  // Suggest rollup for high-volume subscriptions

  return suggestions;
}
```

---

## Implementation Roadmap

### Phase 1: Core Parity (Current - Q1 2026)

✅ **Completed:**
- Google OAuth authentication
- Email scanning and detection
- Subscription management
- Unsubscribe functionality
- Rollup/digest feature
- Background job queues

🟡 **In Progress:**
- Bulk action enhancements

🔴 **Planned:**
- Archive, move, label actions for bulk operations
- Improved error handling and user feedback

### Phase 2: Smart Organization (Q2 2026)

**Features to Implement:**
1. **Smart Folders** - Auto-categorization into Shopping, Social, etc.
2. **Custom Tags/Labels** - User-defined categorization
3. **Advanced Filtering** - Multi-condition filters

**Estimated Effort:** 4-6 weeks

### Phase 3: Automation (Q2-Q3 2026)

**Features to Implement:**
1. **Auto Clean Rules** - Custom automation rules
2. **Scheduled Actions** - Time-based email cleanup
3. **Rule Templates** - Pre-built automation templates

**Estimated Effort:** 6-8 weeks

### Phase 4: Enhanced Security (Q3 2026)

**Features to Implement:**
1. **Screener** - Unknown sender filtering
2. **Privacy Monitor** - Data exposure tracking
3. **Security Alerts** - Suspicious activity detection

**Estimated Effort:** 4-6 weeks

### Phase 5: Multi-Provider Support (Q4 2026)

**Features to Implement:**
1. **Outlook Integration** - Microsoft OAuth
2. **Yahoo Integration** - Yahoo OAuth
3. **IMAP/POP3 Support** - Generic email providers
4. **Unified Dashboard** - Multi-account view

**Estimated Effort:** 8-10 weeks

### Phase 6: Advanced Features (2027)

**Features to Implement:**
1. **Cleaning Suggestions** - AI-powered recommendations
2. **Analytics Dashboard** - Email statistics and insights
3. **Collaborative Features** - Shared accounts (family plans)
4. **Mobile Apps** - Native iOS and Android apps

**Estimated Effort:** 12+ weeks

---

## Pricing Comparison

### CleanEmail Pricing

| Plan | Monthly | Yearly | Accounts |
|------|---------|--------|----------|
| Basic | $9.99/mo | $29.99/yr | 1 |
| Plus | $19.99/mo | $49.99/yr | 5 |
| Premium | $29.99/mo | $99.99/yr | 10 |

### Prunebox Pricing (Planned)

| Plan | Price | Features |
|------|-------|----------|
| Self-Hosted | Free | Full feature set, user hosts |
| Cloud (Future) | TBD | Managed hosting, backups, support |

**Advantage:** Prunebox is free for self-hosted users. No subscription fees for the core product.

---

## Technical Architecture Comparison

### CleanEmail

- **Backend:** Proprietary (details not public)
- **Database:** Not disclosed
- **Queue:** Not disclosed
- **Frontend:** Likely React-based
- **Deployment:** SaaS only

### Prunebox

- **Backend:** Next.js 15 (App Router)
- **Database:** PostgreSQL
- **Queue:** BullMQ + Redis
- **Frontend:** React 19 + Radix UI
- **Deployment:** Self-hosted Docker, future cloud offering

**Advantage:** Prunebox is fully open-source with transparent architecture.

---

## Privacy Comparison

### CleanEmail

- ✅ No data selling
- ✅ Encrypted account access
- ✅ 100% subscription-funded
- ❌ Closed source
- ❌ SaaS only (customer data on their servers)

### Prunebox

- ✅ No data selling
- ✅ Encrypted tokens at rest
- ✅ Open source (auditable)
- ✅ Self-hosted (data stays on your servers)
- ✅ No email content stored (headers only)

**Advantage:** Prunebox offers superior privacy through open-source code and self-hosting.

---

## Unique Prunebox Features

Not available in CleanEmail:

1. **Daily Digest / Rollup** - Aggregate subscriptions into daily emails
2. **Confidence Scoring** - Transparent detection confidence levels
3. **Open Source** - Fully auditable codebase
4. **Self-Hosted** - Complete data control
5. **Free Forever** - No subscription fees for self-hosted users

---

## Migration Considerations

For users considering switching from CleanEmail to Prunebox:

### ✅ Easy Migration
- OAuth re-authorization required
- Email data stays in Gmail
- No data export/import needed

### 🟡 Moderate Effort
- Re-creating auto clean rules (when implemented)
- Re-setting up rollup preferences
- Re-establishing screener rules (when implemented)

### ❌ Not Migratable
- Historical usage statistics
- Community-based suggestions

---

## Development Status

**Current Version:** v0.2.4
**Last Updated:** 2026-03-08
**Repository:** https://github.com/kazimurtaza/prunebox
**License:** Private (Closed Source)

**Active Development:**
- Core authentication and scanning: ✅ Complete
- Subscription management: ✅ Complete
- Unsubscribe functionality: ✅ Complete
- Rollup/digest: ✅ Complete
- Background jobs: ✅ Complete

**In Development:**
- Enhanced bulk actions
- Multi-account support

**Planned:**
- Smart folders/categorization
- Auto clean rules
- Screener feature
- Multi-provider support

---

## Summary

Prunebox is approximately **35% of the way** toward full CleanEmail feature parity. The core infrastructure is solid, with enhanced features like confidence scoring and daily digests. The main gaps are:

1. **Smart organization** (Smart Folders, categorization)
2. **Automation** (Auto Clean Rules)
3. **Security features** (Screener)
4. **Multi-provider support** (Outlook, Yahoo, IMAP)

The advantage of Prunebox is its open-source nature, self-hosting capability, and zero subscription fees. As development continues, it will become a compelling free alternative to CleanEmail.

---

**Next Review:** After Phase 2 completion (Smart Folders)
