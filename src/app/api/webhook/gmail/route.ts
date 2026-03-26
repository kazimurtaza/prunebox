import { NextResponse } from 'next/server';
import { ApiErrorResponse, withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * Verify Gmail webhook signature
 * Gmail uses HMAC SHA256 signature verification
 */
function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret?: string
): boolean {
  // If no secret is configured, skip verification (not recommended for production)
  if (!secret) {
    logger.error('Webhook secret not configured, rejecting request');
    return false;
  }

  // If no signature provided, reject
  if (!signature) {
    logger.warn('Webhook request missing signature');
    return false;
  }

  // Calculate expected HMAC
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  // Compare signatures using timing-safe comparison
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const actualBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  // Use crypto.timingSafeEqual for constant-time comparison
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

// Gmail Push Notification webhook endpoint
// This receives notifications when new emails arrive
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const webhookSecret = process.env.GMAIL_WEBHOOK_SECRET;
    const bodyText = await request.text();

    // Get signature from header
    const signature = request.headers.get('x-goog-signature');

    // Verify signature
    if (!verifyWebhookSignature(bodyText, signature, webhookSecret)) {
      logger.warn('Invalid webhook signature received');
      return ApiErrorResponse.unauthorized('Invalid webhook signature');
    }

    // Parse body after verification
    let body: { message?: { data?: string } };
    try {
      body = JSON.parse(bodyText);
    } catch {
      return ApiErrorResponse.badRequest('Invalid JSON in request body');
    }

    const { message } = body;

    if (!message?.data) {
      return ApiErrorResponse.badRequest('Invalid message format');
    }

    // Decode the base64 data
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const data = JSON.parse(decodedData);

    const { emailAddress, historyId } = data;

    if (!emailAddress || !historyId) {
      return ApiErrorResponse.badRequest('Invalid data: missing emailAddress or historyId');
    }

    logger.info(`Webhook received for ${emailAddress}, historyId: ${historyId}`);

    // Find user by Gmail address
    // In production, you'd map email addresses to user IDs
    // For now, this is a placeholder

    // Queue a scan for this user
    // await queueEmailScan({ userId, ... });

    return NextResponse.json({ success: true });
  }, 'Failed to process Gmail webhook');
}
