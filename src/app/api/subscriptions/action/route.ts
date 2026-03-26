import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { queueUnsubscribe } from '@/modules/queues';
import { ApiErrorResponse, withErrorHandling } from '@/lib/errors';
import { z } from 'zod';
import { getUserTokens } from '@/lib/get-user-tokens';

// Validation schema for subscription action request
const SubscriptionActionSchema = z.object({
  subscriptionId: z.string().min(1, 'subscriptionId is required').cuid('Invalid subscription ID format'),
  action: z.enum(['keep', 'unsubscribe', 'rollup'], {
    errorMap: () => ({ message: 'action must be one of: keep, unsubscribe, rollup' }),
  }),
});

type SubscriptionActionRequest = z.infer<typeof SubscriptionActionSchema>;

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    // Parse and validate request body
    let body: SubscriptionActionRequest;
    try {
      body = await request.json();
    } catch {
      return ApiErrorResponse.badRequest('Invalid JSON in request body');
    }

    // Validate against schema
    const validationResult = SubscriptionActionSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors,
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    const { subscriptionId, action } = validationResult.data;

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

    // If unsubscribe action, queue the unsubscription job
    if (action === 'unsubscribe') {
      const tokens = await getUserTokens(session.user.id);
      if (!tokens || !tokens.accessToken) {
        return ApiErrorResponse.badRequest('No Gmail account found. Please reconnect your Google account.');
      }

      await queueUnsubscribe({
        userId: session.user.id,
        subscriptionId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || undefined,
      });
    }

    return NextResponse.json({ success: true });
  }, 'Failed to update subscription action');
}
