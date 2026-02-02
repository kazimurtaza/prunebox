import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';
import { queueUnsubscribe, queueBulkDelete } from '@/modules/queues';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.accessToken) {
    return NextResponse.json({ error: 'No Gmail access token' }, { status: 400 });
  }

  const accessToken = session.accessToken;
  const refreshToken = session.refreshToken;

  try {
    const body = await request.json();
    const { subscriptionIds, action, senderEmails } = body;

    // Handle delete by sender emails (for non-subscription senders)
    if (action === 'delete' && Array.isArray(senderEmails)) {
      const jobs = senderEmails.map((senderEmail: string) =>
        queueBulkDelete({
          userId: session.user.id,
          senderEmail,
          accessToken,
          refreshToken,
        })
      );
      await Promise.all(jobs);
      return NextResponse.json({ success: true, count: senderEmails.length });
    }

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

    // Handle delete action - queue bulk delete jobs
    if (action === 'delete') {
      const jobs = subscriptions.map((sub) =>
        queueBulkDelete({
          userId: session.user.id,
          senderEmail: sub.senderEmail,
          accessToken,
          refreshToken,
        })
      );
      await Promise.all(jobs);
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
      const jobs = subscriptionIds.map((subscriptionId: string) =>
        queueUnsubscribe({
          userId: session.user.id,
          subscriptionId,
          accessToken,
          refreshToken,
        })
      );
      await Promise.all(jobs);
    }

    return NextResponse.json({ success: true, count: subscriptionIds.length });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
