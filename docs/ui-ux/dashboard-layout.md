# Dashboard Layout Specification

## Overview

The Prunebox dashboard is the primary interface for managing email groups (senders). Users can scan their inbox, view all senders, and take actions like bulk delete, rollup, or unsubscribe.

---

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (Fixed)                                              │
│  ┌────────────┐  ┌─────────────────────────────┐  ┌────────┐│
│  │ Prunebox   │  │ Subscriptions | Rollup | Settings│ │ Avatar ││
│  │ (logo)     │  │                             │ │ SignOut││
│  └────────────┘  └─────────────────────────────┘  └────────┘│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MAIN CONTENT (Container: mx-auto px-4 py-6)                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [Dashboard Page Content - see below]               │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Dashboard Page Layout

### 1. Header Section

| Element | Description |
|---------|-------------|
| **Page Title** | "Your Emails" |
| **Summary Text** | "{count} senders found • {count} emails scanned" |
| **Scan Button** | Primary action with dropdown for Quick Scan / Complete Scan |

### 2. Stats Cards (3 columns)

| Card | Description | Color |
|------|-------------|-------|
| **Total Senders** | Count of unique senders found | Default |
| **Emails Scanned** | Total email count | Blue (`text-blue-600`) |
| **Likely Subscriptions** | Senders with confidence ≥ 70% | Green (`text-green-600`) |

### 3. Email Groups List (Main Card)

The scrollable list contains all email groups with filtering, sorting, and bulk actions.

---

## Email Groups List Controls

### Search Bar
- **Placeholder**: "Search by sender name or email..."
- **Icon**: Search icon (left aligned)
- **Function**: Real-time filtering by sender name or email address

### Filter Buttons (Horizontal)

| Filter | Description |
|--------|-------------|
| **All** | Show all email groups (with count) |
| **Unprocessed** | Show items without an action set |
| **Keep** | Show items marked as "Keep" |
| **Unsubscribe** | Show items marked as "Unsubscribe" |
| **Rollup** | Show items marked for digest rollup |

### Sort Dropdown

| Option | Description |
|--------|-------------|
| **Most Recent** | Sort by `lastSeenAt` descending |
| **Least Recent** | Sort by `lastSeenAt` ascending |
| **Most Emails** | Sort by `messageCount` descending |
| **Least Emails** | Sort by `messageCount` ascending |
| **Name (A-Z)** | Sort by `senderName` ascending |
| **Name (Z-A)** | Sort by `senderName` descending |
| **Highest Confidence** | Sort by `confidenceScore` descending |
| **Lowest Confidence** | Sort by `confidenceScore` ascending |

### Bulk Actions (visible when items selected)

| Action | Variant | Description |
|--------|---------|-------------|
| **Delete All Emails** | Destructive (red) | Delete all emails from selected senders |
| **Unsubscribe** | Outline | Mark selected for unsubscribe |
| **Rollup** | Outline | Mark selected for digest rollup |

---

## Email Group Card

### Collapsed State

```
┌─ EMAIL GROUP CARD ─────────────────────────────────────────────────┐
│ ☐ ▼ Sender Name                           [5 emails]  [75% conf.] │
│    sender@example.com                                             │
│    "Recent email subject..."                                      │
│    [Delete] [Keep] [Rollup] [Unsubscribe]                         │
└───────────────────────────────────────────────────────────────────┘
```

### Expanded State

```
┌─ EMAIL GROUP CARD ─────────────────────────────────────────────────┐
│ ☐ ▲ Sender Name                           [5 emails]  [75% conf.] │
│    sender@example.com                                             │
│    "Recent email subject..."                                      │
│    [Delete] [Keep] [Rollup] [Unsubscribe]                         │
│ ─────────────────────────────────────────────────────────────────  │
│ Recent emails from this sender:                                   │
│   1. First email subject                                          │
│   2. Second email subject                                         │
│   3. Third email subject                                          │
└───────────────────────────────────────────────────────────────────┘
```

### Card Elements

| Element | Description |
|---------|-------------|
| **Checkbox** | For bulk selection |
| **Expand Toggle** | Chevron (▼/▲) to show/hide recent subjects |
| **Sender Name** | Clickable to expand/collapse |
| **Email Count Badge** | Shows "X emails" or "No emails" |
| **Action Badge** | Shows current action (keep/rollup/unsubscribe) if set |
| **Confidence Badge** | Shows confidence score percentage |
| **Sender Email** | Full email address (smaller, muted) |
| **Recent Subject** | Preview of latest email from sender |

### Action Buttons

| Button | Variant | When Active |
|--------|---------|-------------|
| **Delete** | Destructive (red) | Always available |
| **Keep** | Default when action=keep, Outline otherwise | Always available |
| **Rollup** | Default when action=rollup, Outline otherwise | Always available |
| **Unsubscribe** | Secondary when action=unsubscribe, Outline otherwise | Always available |

---

## Scrollable List Area

- **Height**: 800px (configurable in `subscription-list.tsx`)
- **Overflow**: Vertical scroll
- **Padding**: Inner padding for cards
- **Responsive**: Full width on mobile, proper spacing on desktop

---

## Empty States

### No Email Groups (After Initial Scan)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│           [Scan Icon]                           │
│                                                 │
│   No email groups found yet                     │
│   Scan your inbox to find emails grouped        │
│   by sender                                     │
│                                                 │
│           [Scan Inbox]                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### No Filter Results

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   [Mail Icon]                                   │
│                                                 │
│   No email groups found                         │
│   No email groups match the "{filter}" filter.  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────┐
│                                                 │
│        [Spinning Loader]                        │
│                                                 │
│   Loading email groups...                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Processing States

### Card Processing Overlay

When an action (delete/unsubscribe/rollup) is in progress for a specific sender:

- Semi-transparent white/gray overlay over the card
- Centered spinning loader
- "Processing..." text

### Delete Confirmation Dialog

```
┌─────────────────────────────────────────────────┐
│   [Warning Icon] Delete All Emails?             │
│                                                 │
│   This will permanently delete all emails from  │
│   "sender@example.com"                          │
│                                                 │
│   [This action cannot be undone.]               │
│                                                 │
│           [Cancel]  [Delete All Emails]         │
└─────────────────────────────────────────────────┘
```

---

## Responsive Behavior

| Breakpoint | Changes |
|------------|---------|
| **Mobile (< 768px)** | Nav links hidden, stacked layouts, full-width cards |
| **Desktop (≥ 768px)** | Nav links visible, horizontal layouts, proper card wrapping |

---

## Color Scheme

| Purpose | Color | Usage |
|---------|-------|-------|
| **Primary** | Green (`#10b981`) | Actions, highlights, logo |
| **Destructive** | Red (`#dc2626`) | Delete actions, warnings |
| **Muted** | Gray (`text-muted-foreground`) | Secondary text |
| **Background** | Light gray (`bg-gray-50`) | Page background |
| **Card** | White (`bg-white`) | Card backgrounds |
| **Border** | Gray (`border-gray-200`) | Separators |

---

## File Locations

| Component | File |
|-----------|------|
| **Dashboard Layout** | `src/app/dashboard/layout.tsx` |
| **Dashboard Page** | `src/app/dashboard/page.tsx` |
| **Subscription List** | `src/components/subscriptions/subscription-list.tsx` |
| **Scan Button** | `src/components/dashboard/scan-button.tsx` |

---

## Terminology Notes

**Current Naming**: The code and UI use "subscriptions" in many places, but the product has been repositioned to focus on "Email Groups" as the primary concept.

- **Subscription**: A specific sender/group of emails from one sender
- **Email Group**: Preferred terminology for the same concept (more general, includes non-subscription emails)
- **Sender**: The email address that sent the messages

**Note**: Some variable names and API routes still use "subscription" for backward compatibility. The UI should use "Email Groups" where user-visible.

---

## Scan Button States

| State | Display |
|-------|---------|
| **Idle** | "Scan Inbox" with Scan icon |
| **Scanning** | Spinning icon + "Scanning X/Y" progress |
| **Rate Limited** | "Retry in Xs" countdown |
| **Quick Scan** | Last 90 days, up to 1,000 emails |
| **Complete Scan** | Entire inbox, no limit |

---

## Navigation

| Link | URL | Description |
|------|-----|-------------|
| **Subscriptions** | `/dashboard` | Main email groups list |
| **Rollup** | `/dashboard/rollup` | Digest configuration |
| **Settings** | `/dashboard/settings` | User preferences |
