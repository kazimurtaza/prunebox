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
export function detectSubscription(
  headers: Record<string, string>,
  message?: { payload?: { body?: { data?: string }; parts?: any[]; mimeType?: string } }
): SubscriptionDetectionResult {
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

    if (message) {
      const bodyText = extractEmailBody(message);
      const unsubscribeUrl = parseBodyForUnsubscribeLink(bodyText);
      if (unsubscribeUrl) {
        result.unsubscribeUrl = unsubscribeUrl;
        result.method = 'http';
        return result;
      }
    }

    result.method = 'manual';
    return result;
  }

  // 3. Check Precedence header
  const precedence = headers['Precedence']?.toLowerCase();
  if (precedence && ['bulk', 'list', 'junk'].includes(precedence)) {
    result.isSubscription = true;
    result.confidence = 75;

    if (message) {
      const bodyText = extractEmailBody(message);
      const unsubscribeUrl = parseBodyForUnsubscribeLink(bodyText);
      if (unsubscribeUrl) {
        result.unsubscribeUrl = unsubscribeUrl;
        result.method = 'http';
        return result;
      }
    }

    result.method = 'manual';
    return result;
  }

  // 4. Check Auto-Submitted header
  const autoSubmitted = headers['Auto-Submitted']?.toLowerCase();
  if (autoSubmitted && autoSubmitted.includes('auto-generated')) {
    result.isSubscription = true;
    result.confidence = 60;

    if (message) {
      const bodyText = extractEmailBody(message);
      const unsubscribeUrl = parseBodyForUnsubscribeLink(bodyText);
      if (unsubscribeUrl) {
        result.unsubscribeUrl = unsubscribeUrl;
        result.method = 'http';
        return result;
      }
    }

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

    if (message) {
      const bodyText = extractEmailBody(message);
      const unsubscribeUrl = parseBodyForUnsubscribeLink(bodyText);
      if (unsubscribeUrl) {
        result.unsubscribeUrl = unsubscribeUrl;
        result.method = 'http';
        return result;
      }
    }

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

    if (message) {
      const bodyText = extractEmailBody(message);
      const unsubscribeUrl = parseBodyForUnsubscribeLink(bodyText);
      if (unsubscribeUrl) {
        result.unsubscribeUrl = unsubscribeUrl;
        result.method = 'http';
        return result;
      }
    }

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
 * Extract and decode email body text from a Gmail message
 * Handles both simple and multipart MIME messages
 */
export function extractEmailBody(message: { payload?: { body?: { data?: string }; parts?: any[]; mimeType?: string } }): string {
  const payload = message.payload;
  if (!payload) return '';

  const decodeBase64 = (data: string): string => {
    try {
      return Buffer.from(data, 'base64url').toString('utf-8');
    } catch {
      return '';
    }
  };

  const extractFromParts = (parts: any[]): string => {
    for (const part of parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
      if (part.parts) {
        const nested = extractFromParts(part.parts);
        if (nested) return nested;
      }
    }
    return '';
  };

  if (payload.parts) {
    const bodyText = extractFromParts(payload.parts);
    if (bodyText) return bodyText;
  }

  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  return '';
}

/**
 * Parse email body for unsubscribe links
 * Returns the first URL that matches common unsubscribe patterns
 */
export function parseBodyForUnsubscribeLink(bodyText: string): string | undefined {
  if (!bodyText) return undefined;

  const lowerBody = bodyText.toLowerCase();

  const unsubscribePatterns = [
    /https?:\/\/[^\s"'<>]+(?:unsubscribe|un-subscribe|opt-?out|opt[_-]?out|manage|preferences|subscription|settings|notifications)[^\s"'<>]*/gi,
    /https?:\/\/[^\s"'<>]+\/[^\s"'<>]*(?:unsub|optout|opt[_-]?out|manage|pref|subscrib|notif)[^\s"'<>]*/gi,
  ];

  const spamPhrases = [
    'buy now', 'click here', 'limited time', 'act now', 'special offer',
    'winner', 'congratulations', 'free money', 'cash prize', 'urgent',
    'expiration', 'deadline', 'trial', 'offer expires'
  ];

  for (const pattern of unsubscribePatterns) {
    const matches = bodyText.match(pattern);
    if (matches) {
      for (const url of matches) {
        const cleanUrl = url.split(/["'<>]/)[0].split(/[?&]utm_/)[0];

        if (spamPhrases.some(phrase => lowerBody.substring(Math.max(0, lowerBody.indexOf(url) - 100), lowerBody.indexOf(url) + 100).includes(phrase))) {
          continue;
        }

        if (cleanUrl.length > 20 && cleanUrl.length < 500) {
          try {
            new URL(cleanUrl);
            return cleanUrl;
          } catch {
            continue;
          }
        }
      }
    }
  }

  return undefined;
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
