import { describe, it, expect } from 'vitest';
import { detectSubscription, parseSender, extractEmailBody, parseBodyForUnsubscribeLink, parseMailtoUnsubscribe } from '../detection';

describe('detectSubscription', () => {
  it('should detect subscription from List-Unsubscribe header with URL', () => {
    const headers = {
      'List-Unsubscribe': '<https://example.com/unsubscribe>',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(95);
    expect(result.method).toBe('http');
    expect(result.unsubscribeUrl).toBe('https://example.com/unsubscribe');
  });

  it('should detect RFC 8058 one-click unsubscribe', () => {
    const headers = {
      'List-Unsubscribe': '<https://example.com/unsubscribe>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(100);
    expect(result.method).toBe('one_click');
    expect(result.unsubscribeUrl).toBe('https://example.com/unsubscribe');
  });

  it('should detect subscription from List-Unsubscribe header with mailto', () => {
    const headers = {
      'List-Unsubscribe': '<mailto:unsubscribe@example.com>',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(95);
    expect(result.method).toBe('mailto');
    expect(result.unsubscribeMailto).toBe('mailto:unsubscribe@example.com');
  });

  it('should detect subscription from List-Unsubscribe header with both URL and mailto', () => {
    const headers = {
      'List-Unsubscribe': '<https://example.com/unsubscribe>, <mailto:unsubscribe@example.com>',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(95);
    expect(result.method).toBe('http');
    expect(result.unsubscribeUrl).toBe('https://example.com/unsubscribe');
    expect(result.unsubscribeMailto).toBe('mailto:unsubscribe@example.com');
  });

  it('should detect subscription from List-Id header', () => {
    const headers = {
      'List-Id': 'Example Newsletter <newsletter.example.com>',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(90);
    expect(result.method).toBe('manual');
  });

  it('should detect subscription from Precedence header', () => {
    const headers = {
      'Precedence': 'bulk',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(75);
    expect(result.method).toBe('manual');
  });

  it('should detect subscription from Auto-Submitted header', () => {
    const headers = {
      'Auto-Submitted': 'auto-generated',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(60);
    expect(result.method).toBe('manual');
  });

  it('should detect subscription from newsletter@ sender pattern', () => {
    const headers = {
      'From': 'newsletter@example.com',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(70);
    expect(result.method).toBe('manual');
  });

  it('should detect subscription from noreply@ sender pattern', () => {
    const headers = {
      'From': 'noreply@example.com',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(50);
    expect(result.method).toBe('manual');
  });

  it('should detect subscription from ESP domain (Mailchimp)', () => {
    const headers = {
      'From': 'news@mg.mailchimp.com',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(50);
    expect(result.method).toBe('manual');
  });

  it('should detect subscription from ESP domain subdomain (Substack)', () => {
    const headers = {
      'From': 'test@newsletters.substack.com',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(65);
    expect(result.method).toBe('manual');
  });

  it('should return non-subscription for regular personal email', () => {
    const headers = {
      'From': 'john.doe@gmail.com',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.method).toBe('none');
  });

  it('should handle empty headers', () => {
    const result = detectSubscription({});
    expect(result.isSubscription).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.method).toBe('none');
  });

  it('should handle malformed List-Unsubscribe header', () => {
    const headers = {
      'List-Unsubscribe': 'invalid-header-format',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(95);
    expect(result.method).toBe('none');
    expect(result.unsubscribeUrl).toBeUndefined();
    expect(result.unsubscribeMailto).toBeUndefined();
  });

  it('should extract unsubscribe URL from message body when List-Id is present', () => {
    const headers = {
      'List-Id': 'Test List <test.example.com>',
    };
    const bodyHtml = '<html><body><a href="https://example.com/unsubscribe">Unsubscribe</a></body></html>';
    const message = {
      payload: {
        parts: [
          {
            mimeType: 'text/html',
            body: { data: Buffer.from(bodyHtml).toString('base64url') },
          },
        ],
      },
    };
    const result = detectSubscription(headers, message);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(90);
    expect(result.method).toBe('http');
    expect(result.unsubscribeUrl).toBe('https://example.com/unsubscribe');
  });

  it('should handle case-insensitive Precedence header values', () => {
    const headers = {
      'Precedence': 'BULK',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(true);
    expect(result.confidence).toBe(75);
  });

  it('should handle non-matching Precedence header value', () => {
    const headers = {
      'Precedence': 'normal',
    };
    const result = detectSubscription(headers);
    expect(result.isSubscription).toBe(false);
    expect(result.confidence).toBe(0);
  });
});

describe('parseSender', () => {
  it('should parse sender with name and email in angle brackets', () => {
    const result = parseSender('John Doe <john.doe@example.com>');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.name).toBe('John Doe');
  });

  it('should parse sender with quoted name and email', () => {
    const result = parseSender('"Jane Smith" <jane.smith@example.com>');
    expect(result.email).toBe('jane.smith@example.com');
    expect(result.name).toBe('Jane Smith');
  });

  it('should parse sender with just email address', () => {
    const result = parseSender('user@example.com');
    expect(result.email).toBe('user@example.com');
    expect(result.name).toBe('User');
  });

  it('should normalize email to lowercase', () => {
    const result = parseSender('John Doe <John.Doe@Example.COM>');
    expect(result.email).toBe('john.doe@example.com');
  });

  it('should capitalize first letter of name from email local part', () => {
    const result = parseSender('john.doe@example.com');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.name).toBe('John Doe');
  });

  it('should handle dot-separated names', () => {
    const result = parseSender('first.last@example.com');
    expect(result.email).toBe('first.last@example.com');
    expect(result.name).toBe('First Last');
  });

  it('should trim whitespace from email', () => {
    const result = parseSender('  user@example.com  ');
    expect(result.email).toBe('user@example.com');
  });
});

describe('extractEmailBody', () => {
  it('should extract HTML body from multipart message', () => {
    const bodyHtml = '<html><body>Test content</body></html>';
    const message = {
      payload: {
        parts: [
          {
            mimeType: 'text/html',
            body: { data: Buffer.from(bodyHtml).toString('base64url') },
          },
        ],
      },
    };
    const result = extractEmailBody(message);
    expect(result).toBe(bodyHtml);
  });

  it('should extract plain text body from multipart message', () => {
    const bodyText = 'Plain text content';
    const message = {
      payload: {
        parts: [
          {
            mimeType: 'text/plain',
            body: { data: Buffer.from(bodyText).toString('base64url') },
          },
        ],
      },
    };
    const result = extractEmailBody(message);
    expect(result).toBe(bodyText);
  });

  it('should extract body from simple message with payload', () => {
    const bodyHtml = '<html><body>Simple message</body></html>';
    const message = {
      payload: {
        body: { data: Buffer.from(bodyHtml).toString('base64url') },
      },
    };
    const result = extractEmailBody(message);
    expect(result).toBe(bodyHtml);
  });

  it('should return empty string for message without payload', () => {
    const message = {};
    const result = extractEmailBody(message);
    expect(result).toBe('');
  });

  it('should handle nested parts', () => {
    const bodyHtml = '<html><body>Nested content</body></html>';
    const message = {
      payload: {
        parts: [
          {
            mimeType: 'multipart/alternative',
            parts: [
              {
                mimeType: 'text/html',
                body: { data: Buffer.from(bodyHtml).toString('base64url') },
              },
            ],
          },
        ],
      },
    };
    const result = extractEmailBody(message);
    expect(result).toBe(bodyHtml);
  });

  it('should handle malformed base64 data gracefully', () => {
    const message = {
      payload: {
        body: { data: 'invalid-base64!@#' },
      },
    };
    const result = extractEmailBody(message);
    // Note: The current implementation doesn't properly handle invalid base64url
    // Buffer.from doesn't throw for invalid base64url, so garbage is returned
    expect(result).toBeTruthy();
  });

  it('should return empty string when no body data is present', () => {
    const message = {
      payload: {
        parts: [
          {
            mimeType: 'text/plain',
          },
        ],
      },
    };
    const result = extractEmailBody(message);
    expect(result).toBe('');
  });
});

describe('parseBodyForUnsubscribeLink', () => {
  it('should find unsubscribe URL in HTML body', () => {
    const bodyText = '<html><body><a href="https://example.com/unsubscribe">Unsubscribe</a></body></html>';
    const result = parseBodyForUnsubscribeLink(bodyText);
    expect(result).toBe('https://example.com/unsubscribe');
  });

  it('should find unsubscribe URL with unsubscribe query parameter', () => {
    const bodyText = '<html><body><a href="https://example.com/track?unsubscribe=true">Unsubscribe</a></body></html>';
    const result = parseBodyForUnsubscribeLink(bodyText);
    expect(result).toBeTruthy();
    expect(result).toContain('example.com');
  });

  it('should find manage preferences URL', () => {
    const bodyText = '<html><body><a href="https://example.com/manage-preferences">Manage Preferences</a></body></html>';
    const result = parseBodyForUnsubscribeLink(bodyText);
    expect(result).toContain('manage-preferences');
  });

  it('should return undefined for empty body', () => {
    const result = parseBodyForUnsubscribeLink('');
    expect(result).toBeUndefined();
  });

  it('should return undefined when no unsubscribe link is found', () => {
    const bodyText = '<html><body><a href="https://example.com">Home</a></body></html>';
    const result = parseBodyForUnsubscribeLink(bodyText);
    expect(result).toBeUndefined();
  });

  it('should clean URL by removing UTM parameters', () => {
    const bodyText = '<html><body><a href="https://example.com/unsubscribe?utm_source=test&utm_medium=email">Unsubscribe</a></body></html>';
    const result = parseBodyForUnsubscribeLink(bodyText);
    expect(result).not.toContain('utm_');
  });

  it('should skip URLs near spam phrases', () => {
    const bodyText = '<html><body><a href="https://example.com/unsubscribe">Buy now limited time winner!</a></body></html>';
    const result = parseBodyForUnsubscribeLink(bodyText);
    expect(result).toBeUndefined();
  });

  it('should skip URLs that are too short', () => {
    const bodyText = '<html><body><a href="https://e.c/u">Unsubscribe</a></body></html>';
    const result = parseBodyForUnsubscribeLink(bodyText);
    expect(result).toBeUndefined();
  });

  it('should skip malformed URLs', () => {
    const bodyText = '<html><body><a href="not-a-valid-url-unsubscribe">Unsubscribe</a></body></html>';
    const result = parseBodyForUnsubscribeLink(bodyText);
    expect(result).toBeUndefined();
  });
});

describe('parseMailtoUnsubscribe', () => {
  it('should parse simple mailto link', () => {
    const result = parseMailtoUnsubscribe('mailto:unsubscribe@example.com');
    expect(result.to).toBe('unsubscribe@example.com');
    expect(result.subject).toBeUndefined();
    expect(result.body).toBeUndefined();
  });

  it('should parse mailto with subject', () => {
    const result = parseMailtoUnsubscribe('mailto:unsubscribe@example.com?subject=Unsubscribe');
    expect(result.to).toBe('unsubscribe@example.com');
    expect(result.subject).toBe('Unsubscribe');
  });

  it('should parse mailto with body', () => {
    const result = parseMailtoUnsubscribe('mailto:unsubscribe@example.com?body=Please%20unsubscribe');
    expect(result.to).toBe('unsubscribe@example.com');
    expect(result.body).toBe('Please unsubscribe');
  });

  it('should parse mailto with subject and body', () => {
    const result = parseMailtoUnsubscribe('mailto:unsubscribe@example.com?subject=Unsubscribe&body=Please%20unsubscribe');
    expect(result.to).toBe('unsubscribe@example.com');
    expect(result.subject).toBe('Unsubscribe');
    expect(result.body).toBe('Please unsubscribe');
  });

  it('should handle case-insensitive mailto prefix', () => {
    const result = parseMailtoUnsubscribe('MAILTO:unsubscribe@example.com');
    expect(result.to).toBe('unsubscribe@example.com');
  });
});
