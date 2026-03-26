export interface SubscriptionDetectionResult {
  isSubscription: boolean;
  confidence: number;
  unsubscribeUrl?: string;
  unsubscribeMailto?: string;
  method: 'one_click' | 'mailto' | 'http' | 'manual' | 'none';
  senderName?: string;
  senderEmail?: string;
}

/**
 * Detect if an email is a subscription/mailing list
 * Based on RFC 2369, RFC 8058, and common patterns
 */
export function detectSubscription(headers: Record<string, string>): SubscriptionDetectionResult {
  const result: SubscriptionDetectionResult = {
    isSubscription: false,
    confidence: 0,
    method: 'none',
  };

  // 1. Check List-Unsubscribe header (highest confidence)
  const listUnsubscribe = headers['List-Unsubscribe'];
  const listUnsubscribePost = headers['List-Unsubscribe-Post'];

  if (listUnsubscribe) {
    result.isSubscription = true;
    result.confidence = 95; // Very high confidence

    // Parse List-Unsubscribe header
    // Format: <https://example.com/unsub>, <mailto:unsub@example.com>
    const urlMatch = listUnsubscribe.match(/<(https?:[^>]+)>/);
    const mailtoMatch = listUnsubscribe.match(/<(mailto:[^>]+)>/);

    if (urlMatch) {
      result.unsubscribeUrl = urlMatch[1];

      // Check for RFC 8058 one-click unsubscribe
      if (listUnsubscribePost && listUnsubscribePost.includes('One-Click')) {
        result.method = 'one_click';
        result.confidence = 100;
      } else {
        result.method = 'http';
      }
    }

    if (mailtoMatch) {
      result.unsubscribeMailto = mailtoMatch[1];
      if (!result.unsubscribeUrl) {
        result.method = 'mailto';
      }
    }

    return result;
  }

  // 2. Check List-Id header (mailing list identifier)
  if (headers['List-Id']) {
    result.isSubscription = true;
    result.confidence = 90;
    result.method = 'manual'; // Need to find unsubscribe link in body
    return result;
  }

  // 3. Check Precedence header
  const precedence = headers['Precedence']?.toLowerCase();
  if (precedence && ['bulk', 'list', 'junk'].includes(precedence)) {
    result.isSubscription = true;
    result.confidence = 75;
    result.method = 'manual';
    return result;
  }

  // 4. Check Auto-Submitted header
  const autoSubmitted = headers['Auto-Submitted']?.toLowerCase();
  if (autoSubmitted && autoSubmitted.includes('auto-generated')) {
    result.isSubscription = true;
    result.confidence = 60;
    result.method = 'manual';
    return result;
  }

  // 5. Check sender patterns (medium confidence)
  const from = headers['From'] || '';
  const fromLower = from.toLowerCase();

  // Common newsletter sender patterns
  const senderPatterns = [
    'newsletter@',
    'noreply@',
    'no-reply@',
    'no_reply@',
    'marketing@',
    'updates@',
    'news@',
    'digest@',
    'notifications@',
    'notification@',
    'announce@',
    'announcements@',
    'alert@',
    'alerts@',
    'mailer@',
    'bounce@',
    'donotreply@',
    'do-not-reply@',
    'comm@',
    'info@',
    'hello@',
    'team@',
    'support@',
    'contact@',
    'hi@',
    'mail@',
    'email@',
    'update@',
    'daily@',
    'weekly@',
    'messages@',
    'msg@',
  ];

  const matchedPattern = senderPatterns.find((pattern) => fromLower.includes(pattern));

  if (matchedPattern) {
    result.isSubscription = true;
    result.confidence = matchedPattern === 'newsletter@' ? 70 : 50;
    result.method = 'manual';
    return result;
  }

  // 6. Check domain patterns (email service providers)
  const fromDomain = from.split('@')[1]?.toLowerCase() || '';
  const espDomains = [
    '.mailchimp.com',
    '.sendgrid.net',
    '.constantcontact.com',
    '.campaignmonitor.com',
    '.convertkit.com',
    '.getrevue.co',
    '.substack.com',
    '.beehiiv.com',
    '.convertkit-mail.com',
    '.mg.mailchimp.com',
    '.sendinblue.com',
    '.brevo.com',
    '.aweber.com',
    '.activehost.com',
    '.icontact.com',
    '.emm.tf',
    '.mailerlite.com',
  ];

  if (espDomains.some((domain) => fromDomain.includes(domain))) {
    result.isSubscription = true;
    result.confidence = 65;
    result.method = 'manual';
    return result;
  }

  // Not detected as a subscription
  return result;
}

/**
 * Extract sender email and name from From header
 * Normalizes email to lowercase to prevent duplicate groups
 */
export function parseSender(fromHeader: string): { email: string; name: string } {
  const emailMatch = fromHeader.match(/<([^>]+)>/);
  const email = emailMatch ? emailMatch[1] : fromHeader.trim();

  const nameMatch = fromHeader.match(/^"?(.+?)"?\s*</);
  const name = nameMatch ? nameMatch[1].replace(/^"|"$/g, '') : '';

  // Extract name from email if no separate name
  const displayName = name || email.split('@')[0];

  // Capitalize first letter
  const formattedName = displayName
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    email: email.toLowerCase(), // Normalize to lowercase
    name: formattedName,
  };
}

/**
 * Build Gmail search query for subscription detection
 */
export function buildSubscriptionQuery(daysBack = 30): string {
  return [
    'in:inbox',
    `newer_than:${daysBack}d`,
    // Common list indicators
    'list:"unsubscribe"', // This searches for the header
    'OR',
    'list:"list-id"',
    'OR',
    'from:noreply@',
    'OR',
    'from:newsletter@',
    'OR',
    'from:marketing@',
    'OR',
    'from:updates@',
    'OR',
    'from:notifications@',
  ].join(' ');
}

/**
 * Parse mailto unsubscribe link
 */
export function parseMailtoUnsubscribe(mailtoUrl: string): { to: string; subject?: string; body?: string } {
  // Remove mailto: prefix
  const withoutPrefix = mailtoUrl.replace(/^mailto:/i, '');

  const [to, ...queryParts] = withoutPrefix.split('?');
  const queryString = queryParts.join('?');

  const params = new URLSearchParams(queryString);

  return {
    to,
    subject: params.get('subject') || undefined,
    body: params.get('body') || undefined,
  };
}
