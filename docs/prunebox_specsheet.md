# Comprehensive Specification for Building an Unroll.me SaaS Clone

Building a Gmail-focused email subscription management SaaS requires navigating complex technical, legal, and competitive considerations. This specification provides everything needed to build a privacy-first alternative to Unroll.me—one that actually unsubscribes users rather than just filtering emails, while avoiding the data-selling practices that destroyed Unroll.me's reputation.

The core insight: Unroll.me's 2017 scandal (selling Lyft receipt data to Uber) created a market gap for privacy-respecting alternatives. **Clean Email** ($29.99/year) and **Leave Me Alone** now dominate by offering true unsubscribe functionality with transparent data practices. A new entrant can compete by combining true unsubscribe, mass deletion capabilities, and aggressive privacy positioning with modern UX.

---

## Unroll.me's actual functionality reveals critical product gaps

Unroll.me markets three core actions—Unsubscribe, Rollup (digest), and Keep—but **critical examination reveals it doesn't actually unsubscribe users**. When users click "Unsubscribe," Unroll.me merely moves emails to a hidden folder. Subscriptions remain active; disconnecting the service floods emails back into the inbox. This creates genuine opportunity for competitors offering permanent unsubscription.

**Complete Unroll.me feature breakdown:**
- **Subscription Discovery**: Scans entire inbox using proprietary algorithms to identify newsletter patterns; processes 10,000+ messages in minutes; creates dedicated "Unroll.me" folder automatically
- **"Unsubscribe" (filtering only)**: Moves emails to Unroll.Me/Unsubscribed folder; some reputable senders (eBay, PayPal) redirect to their preference centers
- **Rollup Digest**: Consolidates selected subscriptions into single daily email; three delivery times (morning, afternoon, evening); single digest per account with no customization
- **Supported Providers**: Gmail, Google Workspace, Yahoo, Outlook/Hotmail, AOL, iCloud

**User flow and onboarding**: OAuth connection requiring 2-step verification for Gmail; full inbox scanning; subscription list display with swipe gestures (mobile) or click actions (desktop) for categorization; settings via gear icon for delivery preferences.

**How subscription detection works**: List-Unsubscribe header analysis (RFC 2369), Precedence headers (`bulk`, `list`), sender pattern matching (noreply@, newsletter@, etc.), recurring email detection from same senders, marketing content indicators. Algorithm cannot be manually overridden—if it misses a subscription, users cannot add it.

---

## The Uber scandal and ongoing privacy issues define market positioning

In April 2017, the New York Times revealed Unroll.me's parent company Slice sold user data—specifically **Lyft receipt data extracted from inboxes**—to Uber for competitive intelligence. This triggered massive backlash and a class action lawsuit alleging violations of the Electronic Communications Privacy Act and Stored Communications Act (Case No. 3:17-cv-02340, N.D. Cal.).

**Current monetization model under NielsenIQ ownership:**
Unroll.me explicitly states on their website: *"When you register for Unroll.Me, we access your commercial emails, using that data to enhance advertising products, measurement products, datasets and other services for our customers."* The service is free because users' email data feeds NielsenIQ's **5.5+ million user consumer panel** for market research.

**Key user complaints from reviews:**
- "Doesn't actually unsubscribe"—just filters emails
- Important work emails incorrectly categorized as subscriptions
- Difficulty truly deleting account; reports of service re-establishing access
- No "select all" button for bulk actions
- Cannot manually add missed subscriptions
- Grid-style previews removed in updates, reducing scannability
- Not available in EU due to GDPR non-compliance

---

## Gmail API technical architecture for reading, modifying, and deleting emails

Gmail API access requires OAuth 2.0 with carefully selected scopes. **All Gmail content-access scopes are classified as "Restricted"** by Google, requiring annual CASA security audits.

**Required OAuth scopes for a full-featured clone:**

| Scope | Classification | Use Case |
|-------|---------------|----------|
| `gmail.readonly` | Restricted | Read email headers for subscription detection |
| `gmail.modify` | Restricted | Move emails, apply labels, trash messages |
| `gmail.labels` | Non-sensitive | Create/manage subscription labels |
| `gmail.send` | Sensitive | Send rollup digest emails |

**Rate limits and quotas (critical for bulk operations):**
- **Per-project**: 1,200,000 quota units/minute
- **Per-user**: 15,000 quota units/minute (~250/second moving average)
- **Operation costs**: `messages.list` = 5 units; `messages.get` = 5 units; `messages.batchDelete` = 50 units; `messages.send` = 100 units

**Bulk deletion strategy:**
```javascript
// Use batchDelete for efficiency (up to 1000 IDs per call)
await gmail.users.messages.batchDelete({
  userId: 'me',
  requestBody: { ids: messageIds } // max 1000
});
```
Batch operations cost 50 units vs. 10 units per individual delete. For a user with 50,000 newsletter emails, deletion requires ~50 batch calls consuming ~2,500 quota units—well within per-user limits.

---

## Detecting subscription emails programmatically with high accuracy

**Primary detection method—List-Unsubscribe header (RFC 2369):**
```
List-Unsubscribe: <mailto:unsub@example.com>, <https://example.com/unsub?id=123>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```
This header provides **high-confidence subscription identification** and often contains the exact mechanism for unsubscription.

**Secondary detection signals:**
- `List-Id` header (mailing list identifier)
- `Precedence: bulk` or `Precedence: list` headers
- Sender patterns: `noreply@`, `newsletter@`, `updates@`, `marketing@`, `notifications@`
- Domain patterns: `*.mailchimp.com`, `*.sendgrid.net`, `*.constantcontact.com`
- Gmail category: `category:promotions` or `category:updates`

**Recommended detection algorithm:**
```javascript
function isSubscriptionEmail(headers) {
  // High confidence indicators
  if (headers['List-Unsubscribe'] || headers['List-Id']) return true;
  
  const precedence = headers['Precedence']?.toLowerCase();
  if (['bulk', 'list', 'junk'].includes(precedence)) return true;
  
  // Medium confidence - sender patterns
  const from = headers['From']?.toLowerCase() || '';
  const patterns = ['newsletter@', 'noreply@', 'no-reply@', 'marketing@', 'updates@'];
  return patterns.some(p => from.includes(p));
}
```

---

## Automated unsubscription via List-Unsubscribe header

**RFC 8058 one-click unsubscribe (modern standard):**
When both `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers are present, send a POST request:
```javascript
await fetch(unsubscribeUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'List-Unsubscribe=One-Click'
});
```

**Mailto unsubscribe handling:**
Parse `mailto:unsub@example.com?subject=unsubscribe` and send an email via Gmail API on behalf of the user.

**Edge cases requiring fallback:**
- No List-Unsubscribe header → parse email body for unsubscribe links
- HTTP unsubscribe shows confirmation page → may require headless browser
- CAPTCHA protection → flag for manual user action
- Broken/expired links → report failure to user

---

## Competitive landscape and pricing strategy

The market segments into four categories: AI inbox organizers (SaneBox), true unsubscribe specialists (Clean Email, Leave Me Alone), bulk cleanup tools (Mailstrom), and free data-monetizers (Unroll.me, Cleanfox).

**Feature comparison matrix:**

| Feature | Clean Email | Leave Me Alone | SaneBox | Unroll.me |
|---------|-------------|----------------|---------|-----------|
| **True unsubscribe** | ✅ | ✅ | ❌ (filter) | ❌ (filter) |
| **Email rollup/digest** | ✅ | ✅ (multiple) | ✅ | ✅ (single) |
| **Bulk delete** | ✅ | ✅ | Limited | ❌ |
| **Privacy (no data selling)** | ✅ | ✅ | ✅ | ❌ |
| **EU availability** | ✅ | ✅ | ✅ | ❌ |
| **Starting price** | $29.99/yr | $19 one-time | $59/yr | Free |

**Clean Email** ($29.99/year) offers the best feature-to-price ratio with 33 smart folders, Screener for cold email blocking, and true unsubscription. **Leave Me Alone** differentiates with privacy-first positioning, multiple customizable rollups (up to 10), and indie company appeal. **SaneBox** ($59-299/year) leads in AI automation but only filters—doesn't truly unsubscribe.

**Market gaps to exploit:**
- No competitor offers GDPR Article 17 "right to be forgotten" data deletion requests
- Mobile-native experience underserved
- Mass deletion from specific senders is underdeveloped
- Business/team features nearly nonexistent

---

## Node.js technical implementation architecture

**Recommended technology stack:**

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 15+ with App Router | Server components for sensitive data, NextAuth integration |
| UI Components | shadcn/ui + TailwindCSS | Modern, customizable, great TypeScript support |
| Authentication | NextAuth.js v5 | Built-in Google OAuth with token persistence |
| Backend | Next.js API Routes | Colocation with frontend, Vercel deployment |
| Database | PostgreSQL + Prisma | Relational data fits well, strong typing |
| Job Queue | BullMQ + Redis | Reliable scheduling, retry logic, monitoring |
| Gmail API | `googleapis` npm package | Official Google library, full API coverage |

**Critical OAuth implementation detail:**
Google only provides a refresh token on the **first sign-in**. You must use `access_type: 'offline'` AND `prompt: 'consent'` to receive it:
```javascript
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',  // Required for refresh token
  prompt: 'consent',       // Force consent to get refresh token
  scope: SCOPES
});
```
Store refresh tokens encrypted (AES-256) immediately—they're essential for background processing when users aren't actively logged in.

**Background job architecture with BullMQ:**
```javascript
// Define queues for async operations
export const emailScanQueue = new Queue('email-scan', { connection });
export const unsubscribeQueue = new Queue('unsubscribe', { connection });
export const rollupQueue = new Queue('rollup-digest', { connection });

// Schedule daily digest
await rollupQueue.add('daily-digest', { userId }, {
  repeat: { pattern: '0 8 * * *' },  // Daily 8 AM
  jobId: `digest-${userId}`           // Prevent duplicates
});
```

**Email monitoring approach:**

The MVP uses **manual scans** triggered by the user via the scan button. Users explicitly initiate email scans to detect new subscriptions when needed.

For future enhancement, two automatic approaches are documented:
1. **Polling**: Use Gmail's history API (`history.list`) every 5-15 minutes per user
2. **Push Notifications**: Gmail Push Notifications via Pub/Sub with `users.watch()` (7-day renewal required)

---

## Database schema for subscription tracking

```sql
-- Core tables (PostgreSQL)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  sender_email VARCHAR(320) NOT NULL,
  sender_name VARCHAR(255),
  list_unsubscribe_header TEXT,        -- Store for unsubscribe processing
  unsubscribe_method VARCHAR(50),      -- 'mailto', 'http', 'manual'
  unsubscribe_url TEXT,                -- Parsed HTTP unsubscribe URL
  unsubscribe_mailto TEXT,             -- Parsed mailto unsubscribe address
  message_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  confidence_score INTEGER DEFAULT 50, -- Detection confidence (0-100)
  recent_subject VARCHAR(255),         -- Latest email subject for preview
  recent_snippet TEXT,                 -- Latest email snippet for preview
  UNIQUE(user_id, sender_email)
);

CREATE TABLE subscription_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID NOT NULL,
  action VARCHAR(20) DEFAULT 'keep',   -- 'keep', 'unsubscribe', 'rollup'
  rollup_frequency VARCHAR(20),        -- 'daily', 'weekly'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, subscription_id)
);

CREATE TABLE gmail_sync_state (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  history_id BIGINT,                   -- For incremental sync
  watch_expiration TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  scan_status VARCHAR(20) DEFAULT 'idle', -- 'idle', 'scanning', 'completed', 'failed'
  scan_progress INTEGER,               -- Current progress count for UX
  scan_total INTEGER,                  -- Total messages to scan
  error_message TEXT                   -- Error details if scan fails
);

-- Unsubscription attempt tracking for audit trail
CREATE TABLE unsubscription_attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID NOT NULL,
  method VARCHAR(50),                  -- 'one-click', 'mailto', 'manual'
  status VARCHAR(20),                  -- 'pending', 'completed', 'failed'
  error_message TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Bulk deletion job tracking for async operations
CREATE TYPE deletion_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE bulk_deletion_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  sender_email VARCHAR(320) NOT NULL,
  status deletion_status DEFAULT 'pending',
  total_messages INTEGER NOT NULL,
  deleted_messages INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- User customization for digest delivery
CREATE TYPE delivery_slot AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

CREATE TABLE rollup_settings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  enabled BOOLEAN DEFAULT false,
  delivery_slot delivery_slot DEFAULT 'MORNING',
  timezone VARCHAR(50) DEFAULT 'UTC',
  digest_name VARCHAR(100) DEFAULT 'My Daily Rollup',
  last_sent_at TIMESTAMP WITH TIME ZONE
);
```

---

## Google verification process and timeline

**All Gmail content-access scopes are Restricted**, triggering Google's most stringent verification requirements.

**Process timeline:**

| Phase | Duration |
|-------|----------|
| Brand verification (domain, privacy policy) | 2-3 business days |
| Initial OAuth scope review | 1-4 weeks |
| CASA Tier 2 security assessment | 1-3 weeks |
| **Total minimum** | **4-8 weeks** |
| With issues/remediation | **3-6 months** |

**CASA (Cloud Application Security Assessment) costs:**
- **Tier 2** (most apps): $500-1,000/year
- **Tier 3** (if required): $4,500+/year
- **Annual recertification mandatory** every 12 months

**Without verification:**
- Limited to 100 lifetime users
- "Unverified app" warning screen shown
- Refresh tokens expire after 7 days
- Cannot operate in production

---

## Legal compliance requirements

**Google API Limited Use policy is non-negotiable:**
- Data can **only** be used to provide/improve user-facing features
- Cannot sell data to third parties
- Cannot use for advertising purposes
- Cannot train non-personalized AI/ML models
- Must enable user data deletion on request

**GDPR requirements for EU users:**
- Data Processing Agreements with all subprocessors
- Standard Contractual Clauses for US-EU data transfers
- Right to erasure implementation (delete all user data on request)
- **72-hour breach notification** to supervisory authorities
- Consent must be explicit and opt-in (not pre-checked boxes)

**Privacy policy must include:**
1. Exact data types collected (email headers, sender addresses, etc.)
2. Purpose of collection (subscription management only)
3. Storage location and duration
4. Third parties with data access (none, ideally)
5. Limited Use disclosure: *"The use of information received from Gmail APIs will adhere to Google's User Data Policy, including the Limited Use requirements."*

---

## Recommended product architecture

**Phase 1 architecture (MVP):**
```
┌─────────────────────────────────────────────────┐
│                 Next.js Application             │
├─────────────────────────────────────────────────┤
│   Auth Module  │  Gmail Module  │  Subscriptions │
│   (NextAuth)   │  (googleapis)  │    Module      │
├─────────────────────────────────────────────────┤
│              PostgreSQL + Redis                 │
└─────────────────────────────────────────────────┘
```

**Phase 2 (scale):**
Extract background workers into separate services:
- Scan Worker: Processes initial inbox scans and new email detection
- Unsubscribe Worker: Handles async unsubscription requests
- Rollup Worker: Generates and sends digest emails

**shadcn/ui components needed:**
```bash
npx shadcn@latest add button card table data-table dialog
npx shadcn@latest add dropdown-menu select checkbox badge
npx shadcn@latest add tabs toast skeleton avatar scroll-area
```

---

## Development timeline and budget

**Estimated development phases:**

| Phase | Duration | Focus |
|-------|----------|-------|
| Week 1-2 | Auth, Gmail connection, basic scanning | Core infrastructure |
| Week 3-4 | Subscription UI, preference storage | User-facing features |
| Week 5-6 | Rollup digest generation and delivery | Key differentiator |
| Week 7-8 | True unsubscribe automation | Market differentiation |
| Week 9-12 | Polish, verification submission | Production readiness |

**Compliance and legal budget:**

| Item | Cost |
|------|------|
| Initial legal counsel (privacy policy, ToS) | $5,000-15,000 |
| CASA Tier 2 audit (annual) | $500-1,000 |
| Cyber liability insurance | $2,000-5,000/year |
| **First year compliance total** | **$7,500-21,000** |

**Recommended pricing for new entrant:**
- Annual: $24.99/year (undercut Clean Email)
- Monthly: $4.99/month  
- Lifetime: $59-79 one-time (capture hesitant users)
- Free tier: 10 unsubscribes + subscription list view

---

## Conclusion

Building an Unroll.me clone that succeeds requires understanding why the original failed: users felt betrayed by hidden data monetization. The winning strategy combines **true unsubscription** (not just filtering), **transparent privacy practices** (no data selling, ever), and **mass deletion capabilities** for inbox cleanup.

Technical barriers are surmountable but significant—the **4-12 week Google verification process** and **$500+/year CASA audits** create meaningful moats. First-mover advantage in the post-Unroll.me privacy-conscious market goes to Clean Email and Leave Me Alone, but their pricing ($30-60/year) and feature gaps (limited mass deletion, no data deletion requests) leave room for a well-positioned competitor.

The specification above provides the complete blueprint for building this product with Node.js, Next.js, and shadcn/ui, targeting Gmail first with the architecture to expand to other providers via IMAP.