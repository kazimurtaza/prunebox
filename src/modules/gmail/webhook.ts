import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { createLogger } from '@/lib/logger';

/**
 * Verify Gmail Push Notification webhook signature
 *
 * Gmail/Google Cloud Pub/Sub webhooks use JWT authentication.
 * The authorization header contains a bearer token signed by Google.
 *
 * In production with Google Cloud Pub/Sub:
 * - The token is signed by Google's Pub/Sub service
 * - We verify against Google's public keys
 * - We also verify the audience matches our project
 *
 * For development/testing without Pub/Sub:
 * - Use a shared secret via GMAIL_WEBHOOK_SECRET env var
 * - This allows testing with mock webhooks
 */

// Google's Pub/Sub issuer for JWT verification
const GOOGLE_PUBSUB_ISSUER = 'https://accounts.google.com';
const GOOGLE_PUBSUB_AUDIENCE = process.env.GOOGLE_PROJECT_ID || '';

/**
 * Verify a Gmail webhook signature using JWT
 *
 * @param payload - Raw request body as string
 * @param authHeader - Authorization header value
 * @returns true if signature is valid
 */
export async function verifyGmailWebhookSignature(
  payload: string,
  authHeader: string | null
): Promise<boolean> {
  const log = createLogger({ module: 'gmail-webhook' });

  // If no auth header, reject immediately
  if (!authHeader) {
    log.warn('Webhook request missing authorization header');
    return false;
  }

  // Extract bearer token
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    log.warn('Invalid authorization header format');
    return false;
  }

  const token = match[1];

  // Development mode: use shared secret if GMAIL_WEBHOOK_SECRET is set
  // This allows testing without full Google Cloud Pub/Sub setup
  if (process.env.GMAIL_WEBHOOK_SECRET) {
    return verifySharedSecretSignature(payload, token);
  }

  // Production mode: verify Google JWT
  return verifyGoogleJwt(token, payload);
}

/**
 * Simple HMAC-based signature verification for development/testing
 * Uses GMAIL_WEBHOOK_SECRET as shared secret
 */
function verifySharedSecretSignature(payload: string, token: string): boolean {
  try {
    const secret = process.env.GMAIL_WEBHOOK_SECRET!;

    // Create HMAC of payload
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Token should be the HMAC signature
    return token === expectedSignature;
  } catch (error) {
    log.error('Shared secret verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Verify Google Cloud Pub/Sub JWT token
 *
 * This verifies:
 * 1. Token signature using Google's public keys
 * 2. Token expiration
 * 3. Issuer (must be Google)
 * 4. Audience (must match our project)
 *
 * Note: Full implementation requires fetching Google's public keys
 * This is a simplified version that validates structure
 */
async function verifyGoogleJwt(token: string, _payload: string): Promise<boolean> {
  const log = createLogger({ module: 'gmail-webhook' });

  try {
    // Parse JWT without verification first to check structure
    const parts = token.split('.');
    if (parts.length !== 3) {
      log.warn('Invalid JWT format');
      return false;
    }

    // Decode payload to check claims
    const decodedPayload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    // Check expiration
    if (decodedPayload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp < now) {
        log.warn('JWT token expired');
        return false;
      }
    }

    // Check issuer
    if (decodedPayload.iss !== GOOGLE_PUBSUB_ISSUER) {
      log.warn('Invalid JWT issuer', { issuer: decodedPayload.iss });
      return false;
    }

    // Check audience if project ID is configured
    if (GOOGLE_PUBSUB_AUDIENCE && decodedPayload.aud !== GOOGLE_PUBSUB_AUDIENCE) {
      log.warn('Invalid JWT audience', { audience: decodedPayload.aud });
      return false;
    }

    // Verify signature using cached Google certs (simplified)
    // Production: Use google-auth-library for robust verification
    const isValid = await verifySignatureWithGoogleCerts(token);
    return isValid;
  } catch (error) {
    log.error('JWT verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Verify JWT signature using Google's public certificates
 *
 * This is a simplified implementation. In production:
 * - Cache the certificates
 * - Handle key rotation
 * - Use google-auth-library for robust verification
 */
async function verifySignatureWithGoogleCerts(token: string): Promise<boolean> {
  const log = createLogger({ module: 'gmail-webhook' });

  try {
    // Use google-auth-library for proper verification
    const client = new OAuth2Client();

    // For Pub/Sub push notifications, we verify the JWT
    // In production, you'd use the Pub/Sub verification pattern
    // This is a simplified approach using OAuth2Client

    try {
      // Verify the token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_PUBSUB_AUDIENCE || undefined,
      });

      const payload = ticket.getPayload();

      // Additional checks
      if (!payload) {
        return false;
      }

      // Check issuer again
      if (payload.iss !== GOOGLE_PUBSUB_ISSUER && !payload.iss.includes('google.com')) {
        return false;
      }

      return true;
    } catch (verifyError) {
      log.warn('JWT verification error', {
        error: verifyError instanceof Error ? verifyError.message : 'Unknown error',
      });
      // In development without proper Google setup, we might want to log but not fail hard
      if (process.env.NODE_ENV === 'development') {
        log.debug('JWT verification failed (dev mode - allowing)');
        return true;
      }
      return false;
    }
  } catch (error) {
    log.error('Google cert verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Extract user info from a verified JWT payload
 * (Useful for logging and debugging)
 */
export interface WebhookJwtPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

/**
 * Parse and decode JWT (for logging only - do not trust without verification)
 */
export function decodeJwt(token: string): WebhookJwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return payload;
  } catch {
    return null;
  }
}
