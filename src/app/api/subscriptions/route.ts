import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
