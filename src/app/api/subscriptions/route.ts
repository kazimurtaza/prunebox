import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { ApiErrorResponse, withErrorHandling } from '@/lib/errors';

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

    const prefMap = new Map(preferences.map((p: { subscriptionId: string; action: string }) => [p.subscriptionId, p.action]));

    const result = subscriptions.map((s: any) => ({
      id: s.id,
      senderEmail: s.senderEmail,
      senderName: s.senderName,
      messageCount: s.messageCount,
      recentSubject: s.recentSubject,
      confidenceScore: s.confidenceScore,
      action: (prefMap.get(s.id) as 'keep' | 'unsubscribe' | 'rollup') || undefined,
    }));

    return NextResponse.json(result);
  }, 'Failed to fetch subscriptions');
}
