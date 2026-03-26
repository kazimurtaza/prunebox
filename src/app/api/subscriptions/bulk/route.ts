import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { runBulkDelete, runUnsubscribe } from '@/modules/queues/jobs';
import { ApiErrorResponse, withErrorHandling } from '@/lib/errors';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getUserTokens } from '@/lib/get-user-tokens';

// Validation schema for bulk action request
const BulkActionSchema = z.object({
  subscriptionIds: z.array(z.string().cuid('Invalid subscription ID format')).optional(),
  senderEmails: z.array(z.string().email('Invalid email format')).optional(),
  action: z.enum(['delete', 'unsubscribe', 'rollup'], {
    errorMap: () => ({ message: 'action must be one of: delete, unsubscribe, rollup' }),
  }),
}).refine(
  (data) => data.subscriptionIds || data.senderEmails,
  { message: 'Either subscriptionIds or senderEmails must be provided' }
);

type BulkActionRequest = z.infer<typeof BulkActionSchema>;

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    // Parse and validate request body
    let body: BulkActionRequest;
    try {
      body = await request.json();
    } catch {
      return ApiErrorResponse.badRequest('Invalid JSON in request body');
    }

    // Validate against schema
    const validationResult = BulkActionSchema.safeParse(body);
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

    const { subscriptionIds, action, senderEmails } = validationResult.data;

    // Get tokens from database instead of session
    const tokens = await getUserTokens(session.user.id);
    if (!tokens || !tokens.accessToken) {
      return ApiErrorResponse.badRequest('No Gmail account found. Please reconnect your Google account.');
    }

    // Handle delete by sender emails (for non-subscription senders)
    if (action === 'delete' && senderEmails && senderEmails.length > 0) {
      // Validate email count limit
      if (senderEmails.length > 100) {
        return ApiErrorResponse.badRequest('Cannot delete more than 100 sender emails at once');
      }

      logger.info(`BULK DELETE: Queuing ${senderEmails.length} delete jobs for user ${session.user.id}`, {
        senderEmails,
      });

      await Promise.all(senderEmails.map((senderEmail: string) =>
        runBulkDelete({
          userId: session.user.id,
          senderEmail,
          accessToken: tokens.accessToken!,
          refreshToken: tokens.refreshToken ?? undefined,
        })
      ));

      logger.info(`BULK DELETE: Completed all ${senderEmails.length} deletes`);
      return NextResponse.json({ success: true, count: senderEmails.length });
    }

    if (!subscriptionIds || subscriptionIds.length === 0) {
      return ApiErrorResponse.badRequest('subscriptionIds array is required for this action');
    }

    // Validate subscription count limit
    if (subscriptionIds.length > 100) {
      return ApiErrorResponse.badRequest('Cannot process more than 100 subscriptions at once');
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
      await Promise.all(subscriptions.map((sub) =>
        runBulkDelete({
          userId: session.user.id,
          senderEmail: sub.senderEmail,
          accessToken: tokens.accessToken!,
          refreshToken: tokens.refreshToken ?? undefined,
        })
      ));

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
      const unsubPromises = subscriptionIds.map((subscriptionId: string) =>
        runUnsubscribe({
          userId: session.user.id,
          subscriptionId,
          accessToken: tokens.accessToken!,
          refreshToken: tokens.refreshToken ?? undefined,
        })
      );
      await Promise.all(unsubPromises);
    }

    return NextResponse.json({ success: true, count: subscriptionIds.length });
  }, 'Failed to perform bulk action');
}
