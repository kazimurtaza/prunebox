import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { queueUnsubscribe, queueBulkDelete } from '@/modules/queues';
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

      const jobs = await Promise.all(senderEmails.map((senderEmail: string) =>
        queueBulkDelete({
          userId: session.user.id,
          senderEmail,
          accessToken: tokens.accessToken!,
          refreshToken: tokens.refreshToken ?? undefined,
        })
      ));

      const jobIds = jobs.map(job => job.id);

      logger.info(`BULK DELETE: Queued all ${senderEmails.length} jobs`);
      return NextResponse.json({ success: true, count: senderEmails.length, jobIds });
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
      const jobs = await Promise.all(subscriptions.map((sub) =>
        queueBulkDelete({
          userId: session.user.id,
          senderEmail: sub.senderEmail,
          accessToken: tokens.accessToken!,
          refreshToken: tokens.refreshToken ?? undefined,
        })
      ));

      const jobIds = jobs.map(job => job.id);

      return NextResponse.json({ success: true, count: subscriptions.length, jobIds });
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
          accessToken: tokens.accessToken!,
          refreshToken: tokens.refreshToken ?? undefined,
        })
      );
      await Promise.all(jobs);
    }

    return NextResponse.json({ success: true, count: subscriptionIds.length });
  }, 'Failed to perform bulk action');
}
