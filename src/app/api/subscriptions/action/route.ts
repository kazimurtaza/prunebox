import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { queueUnsubscribe } from '@/modules/queues';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subscriptionId, action } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get subscription to verify ownership
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.userId !== session.user.id) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
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
      // Note: In a real app, you'd need to get fresh access/refresh tokens
      // from the database. For now, this is a placeholder.
      // await queueUnsubscribe({
      //   userId: session.user.id,
      //   subscriptionId,
      //   accessToken: session.accessToken,
      //   refreshToken: session.refreshToken,
      // });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating subscription action:', error);
    return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
  }
}
