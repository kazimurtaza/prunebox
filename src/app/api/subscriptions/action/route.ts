import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { queueUnsubscribe } from '@/modules/queues';
import { ApiErrorResponse, withErrorHandling, requireFields } from '@/lib/errors';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    const body = await request.json();
    const { subscriptionId, action } = body;

    const validation = requireFields(body, ['subscriptionId', 'action']);
    if (!validation.valid) {
      return ApiErrorResponse.missingFields(validation.missing);
    }

    // Get subscription to verify ownership
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.userId !== session.user.id) {
      return ApiErrorResponse.notFound('Subscription');
    }

    // Upsert preference
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

    if (!session.accessToken) {
      return ApiErrorResponse.badRequest('No Gmail access token');
    }

    // If unsubscribe action, queue the unsubscription job
    if (action === 'unsubscribe') {
      await queueUnsubscribe({
        userId: session.user.id,
        subscriptionId,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken || undefined,
      });
    }

    return NextResponse.json({ success: true });
  }, 'Failed to update subscription action');
}
