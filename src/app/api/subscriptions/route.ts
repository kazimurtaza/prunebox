import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { ApiErrorResponse, withErrorHandling } from '@/lib/errors';
import type { Subscription, SubscriptionPreference } from '@prisma/client';

// Define the subscription action type
type SubscriptionAction = 'keep' | 'unsubscribe' | 'rollup';

// Response type for subscriptions API
interface SubscriptionResponse {
  id: string;
  senderEmail: string;
  senderName: string | null;
  messageCount: number;
  recentSubject: string | null;
  confidenceScore: number;
  action?: SubscriptionAction;
}

export async function GET() {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    const subscriptions = await db.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { lastSeenAt: 'desc' },
      take: 100,
    });

    const preferences = await db.subscriptionPreference.findMany({
      where: { userId: session.user.id },
    });

    const prefMap = new Map<string, string>(
      preferences.map((p: { subscriptionId: string; action: string }) => [p.subscriptionId, p.action])
    );

    const result: SubscriptionResponse[] = subscriptions.map((s: Subscription) => ({
      id: s.id,
      senderEmail: s.senderEmail,
      senderName: s.senderName,
      messageCount: s.messageCount,
      recentSubject: s.recentSubject,
      confidenceScore: s.confidenceScore,
      action: (prefMap.get(s.id) as SubscriptionAction) || undefined,
    }));

    return NextResponse.json(result);
  }, 'Failed to fetch subscriptions');
}
