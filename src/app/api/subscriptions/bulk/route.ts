import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { queueUnsubscribe, queueBulkDelete } from '@/modules/queues';
import { ApiErrorResponse, withErrorHandling, requireFields } from '@/lib/errors';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    if (!session.accessToken) {
      return ApiErrorResponse.badRequest('No Gmail access token');
    }

    const accessToken = session.accessToken;
    const refreshToken = session.refreshToken;

    const body = await request.json();
    const { subscriptionIds, action, senderEmails } = body;

    // Handle delete by sender emails (for non-subscription senders)
    if (action === 'delete' && Array.isArray(senderEmails)) {
      const jobs = senderEmails.map((senderEmail: string) =>
        queueBulkDelete({
          userId: session.user.id,
          senderEmail,
          accessToken,
          refreshToken,
        })
      );
      await Promise.all(jobs);
      return NextResponse.json({ success: true, count: senderEmails.length });
    }

    if (!Array.isArray(subscriptionIds) || !action) {
      return ApiErrorResponse.badRequest('subscriptionIds (array) and action are required');
    }

    // Verify user owns all subscriptions
    const subscriptions = await db.subscription.findMany({
      where: {
        id: { in: subscriptionIds },
        userId: session.user.id,
      },
    });

    if (subscriptions.length !== subscriptionIds.length) {
      return ApiErrorResponse.notFound('Some subscriptions');
    }

    // Handle delete action - queue bulk delete jobs
    if (action === 'delete') {
      const jobs = subscriptions.map((sub) =>
        queueBulkDelete({
          userId: session.user.id,
          senderEmail: sub.senderEmail,
          accessToken,
          refreshToken,
        })
      );
      await Promise.all(jobs);
      return NextResponse.json({ success: true, count: subscriptions.length });
    }

    // For unsubscribe and rollup, create/update preferences
    for (const subscriptionId of subscriptionIds) {
      await db.subscriptionPreference.upsert({
        where: {
          userId_subscriptionId: {
            userId: session.user.id,
            subscriptionId,
          },
        },
        create: {
          userId: session.user.id,
          subscriptionId,
          action,
        },
        update: {
          action,
          updatedAt: new Date(),
        },
      });
    }

    // If unsubscribe action, queue unsubscription jobs
    if (action === 'unsubscribe') {
      const jobs = subscriptionIds.map((subscriptionId: string) =>
        queueUnsubscribe({
          userId: session.user.id,
          subscriptionId,
          accessToken,
          refreshToken,
        })
      );
      await Promise.all(jobs);
    }

    return NextResponse.json({ success: true, count: subscriptionIds.length });
  }, 'Failed to perform bulk action');
}
