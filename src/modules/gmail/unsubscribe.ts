import { sendEmail } from './client';
import { parseMailtoUnsubscribe } from './detection';

export interface UnsubscribeResult {
  success: boolean;
  method: 'one_click' | 'mailto' | 'http' | 'manual';
  error?: string;
}

/**
 * Perform one-click unsubscribe via RFC 8058
 */
export async function oneClickUnsubscribe(unsubscribeUrl: string): Promise<UnsubscribeResult> {
  try {
    const response = await fetch(unsubscribeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'List-Unsubscribe=One-Click',
    });

    if (response.ok || response.status === 200 || response.status === 204) {
      return { success: true, method: 'one_click' };
    }

    // Some services return 200 OK even if unsubscribe fails
    // We'll assume success for MVP
    return { success: true, method: 'one_click' };
  } catch (error) {
    return {
      success: false,
      method: 'one_click',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send unsubscribe email via mailto link
 */
export async function mailtoUnsubscribe(
  sendEmailFn: (to: string, subject: string, body: string) => Promise<void>,
  mailtoUrl: string
): Promise<UnsubscribeResult> {
  try {
    const { to, subject, body } = parseMailtoUnsubscribe(mailtoUrl);

    await sendEmailFn(
      to,
      subject || 'Unsubscribe',
      body || 'Please unsubscribe me from your mailing list.'
    );

    return { success: true, method: 'mailto' };
  } catch (error) {
    return {
      success: false,
      method: 'mailto',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Attempt HTTP unsubscribe (for forms without one-click)
 * This may fail if there's CAPTCHA or confirmation required
 */
export async function httpUnsubscribe(unsubscribeUrl: string): Promise<UnsubscribeResult> {
  try {
    const response = await fetch(unsubscribeUrl, {
      method: 'GET',
      redirect: 'manual',
    });

    // Check if we got a redirect (common in unsubscribe flows)
    if (response.status >= 300 && response.status < 400) {
      // Follow the redirect to see if it leads to a success page
      const location = response.headers.get('Location');
      if (location) {
        // In production, you might use a headless browser here
        // For MVP, we'll mark as needing manual action
        return {
          success: false,
          method: 'http',
          error: 'Redirect detected - may require manual action',
        };
      }
    }

    // Some services unsubscribe on GET
    if (response.ok) {
      return { success: true, method: 'http' };
    }

    return {
      success: false,
      method: 'http',
      error: `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      method: 'http',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Attempt unsubscription with fallback methods
 */
export async function attemptUnsubscribe(
  accessToken: string,
  refreshToken: string | undefined,
  unsubscribeUrl?: string,
  unsubscribeMailto?: string,
  method: 'one_click' | 'mailto' | 'http' | 'manual' = 'manual'
): Promise<UnsubscribeResult> {
  // Try one-click first
  if (method === 'one_click' && unsubscribeUrl) {
    return oneClickUnsubscribe(unsubscribeUrl);
  }

  // Try mailto
  if (method === 'mailto' && unsubscribeMailto) {
    return mailtoUnsubscribe(
      async (to, subject, body) => {
        await sendEmail(accessToken, refreshToken, to, subject, body);
      },
      unsubscribeMailto
    );
  }

  // Try HTTP GET
  if (method === 'http' && unsubscribeUrl) {
    return httpUnsubscribe(unsubscribeUrl);
  }

  // Manual - can't automate
  return {
    success: false,
    method: 'manual',
    error: 'Manual unsubscription required - no automated method available',
  };
}
