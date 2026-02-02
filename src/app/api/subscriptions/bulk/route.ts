import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subscriptionIds, action } = body;

    if (!Array.isArray(subscriptionIds) || !action) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify user owns all subscriptions
    const subscriptions = await db.subscription.findMany({
      where: {
        id: { in: subscriptionIds },
        userId: session.user.id,
      },
    });

    if (subscriptions.length !== subscriptionIds.length) {
      return NextResponse.json({ error: 'Some subscriptions not found' }, { status: 404 });
    }

    // Create or update preferences for all subscriptions
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
      // TODO: Queue unsubscription jobs
    }

    return NextResponse.json({ success: true, count: subscriptionIds.length });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
