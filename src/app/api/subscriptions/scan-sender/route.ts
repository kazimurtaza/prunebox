import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { ApiErrorResponse, withErrorHandling } from '@/lib/errors';
import { listMessages, getMessage, getMessageHeaders } from '@/modules/gmail/client';
import { detectSubscription, parseSender } from '@/modules/gmail/detection';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    if (!session.accessToken) {
      return ApiErrorResponse.badRequest('No Gmail access token');
    }

    const body = await request.json();
    const { senderEmail, senderName } = body;

    if (!senderEmail && !senderName) {
      return ApiErrorResponse.badRequest('senderEmail or senderName is required');
    }

    // Prefer senderName if both provided (more specific for email groups)
    const searchEmail = senderName || senderEmail;

    if (!searchEmail) {
      return ApiErrorResponse.badRequest('senderEmail is required');
    }

    // Find ALL subscriptions matching this sender name
    const query = `from:{searchEmail}`;
    const messageIds = await listMessages(
      session.accessToken,
      session.refreshToken,
      query,
      1000, // max 1000 messages
      session.user.id
    );

    if (messageIds.length === 0) {
      // No messages found, remove the subscription
      await db.subscription.deleteMany({
        where: {
          userId: session.user.id,
          senderEmail,
        },
      });
      return NextResponse.json({ success: true, count: 0, removed: true });
    }

    // Get the latest message to update subscription info
    const latestMessage = await getMessage(
      session.accessToken,
      session.refreshToken,
      messageIds[0],
      'full',
      session.user.id
    );

    if (!latestMessage) {
      return ApiErrorResponse.internal('Failed to fetch message details');
    }

    const headers = getMessageHeaders(latestMessage);
    const detection = detectSubscription(headers);

    const { name: parsedName } = parseSender(headers['From'] || '');

    // Upsert subscription with updated count
    await db.subscription.upsert({
      where: {
        userId_senderEmail: {
          userId: session.user.id,
          senderEmail,
        },
      },
      create: {
        userId: session.user.id,
        senderEmail,
        senderName: parsedName || senderEmail.split('@')[0],
        listUnsubscribeHeader: headers['List-Unsubscribe'],
        unsubscribeMethod: detection.method,
        unsubscribeUrl: detection.unsubscribeUrl,
        unsubscribeMailto: detection.unsubscribeMailto,
        confidenceScore: detection.confidence,
        messageCount: messageIds.length,
        recentSubject: headers['Subject'],
        recentSnippet: latestMessage.snippet,
      },
      update: {
        messageCount: messageIds.length,
        lastSeenAt: new Date(),
        recentSubject: headers['Subject'],
        recentSnippet: latestMessage.snippet,
      },
    });

    return NextResponse.json({ success: true, count: messageIds.length });
  }, 'Failed to scan sender');
}
