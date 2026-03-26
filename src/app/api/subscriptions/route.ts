import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { ApiErrorResponse, withErrorHandling } from '@/lib/errors';
import { Prisma } from '@prisma/client';
import type { Subscription } from '@prisma/client';

// Define the subscription action type
type SubscriptionAction = 'keep' | 'unsubscribe' | 'rollup';

// Response type for subscriptions API
interface SubscriptionResponse {
  id: string;
  senderEmail: string;
  senderName: string | null;
  messageCount: number;
  recentSubject: string | null;
  lastSeenAt: string;
  confidenceScore: number;
  listUnsubscribeHeader: string | null;
  action?: SubscriptionAction;
}

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const parsedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isNaN(parsedLimit) ? 50 : Math.min(parsedLimit, 100);
    const cursor = searchParams.get('cursor');

    // Build where clause with cursor
    const where: Prisma.SubscriptionWhereInput = { userId: session.user.id };
    if (cursor) {
      const parts = cursor.split('_');
      if (parts.length !== 2) {
        return ApiErrorResponse.badRequest('Invalid cursor format');
      }
      const [cursorDate, cursorId] = parts;
      const parsedDate = new Date(cursorDate);
      if (isNaN(parsedDate.getTime()) || !cursorId) {
        return ApiErrorResponse.badRequest('Invalid cursor');
      }
      where.OR = [
        { lastSeenAt: { lt: parsedDate } },
        { lastSeenAt: parsedDate, id: { lt: cursorId } },
      ];
    }

    const subscriptions = await db.subscription.findMany({
      where,
      orderBy: { lastSeenAt: 'desc' },
      take: limit + 1, // Fetch one extra to check if there are more
    });

    const preferences = await db.subscriptionPreference.findMany({
      where: { userId: session.user.id },
    });

    const prefMap = new Map<string, string>(
      preferences.map((p: { subscriptionId: string; action: string }) => [p.subscriptionId, p.action])
    );

    const hasMore = subscriptions.length > limit;
    const trimmedSubscriptions = hasMore ? subscriptions.slice(0, limit) : subscriptions;

    const result: SubscriptionResponse[] = trimmedSubscriptions.map((s: Subscription) => ({
      id: s.id,
      senderEmail: s.senderEmail,
      senderName: s.senderName,
      messageCount: s.messageCount,
      recentSubject: s.recentSubject,
      lastSeenAt: s.lastSeenAt.toISOString(),
      confidenceScore: s.confidenceScore,
      listUnsubscribeHeader: s.listUnsubscribeHeader,
      action: (prefMap.get(s.id) as SubscriptionAction) || undefined,
    }));

    // Generate next cursor from the last item
    let nextCursor: string | null = null;
    if (hasMore && trimmedSubscriptions.length > 0) {
      const lastItem = trimmedSubscriptions[trimmedSubscriptions.length - 1];
      nextCursor = `${lastItem.lastSeenAt.toISOString()}_${lastItem.id}`;
    }

    return NextResponse.json({ subscriptions: result, hasMore, nextCursor });
  }, 'Failed to fetch subscriptions');
}
