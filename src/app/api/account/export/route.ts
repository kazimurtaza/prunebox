import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { auth } from '@/modules/auth/auth';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const [
      user,
      subscriptions,
      preferences,
      rollupSettings,
      syncState,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.subscription.findMany({
        where: { userId },
      }),
      db.subscriptionPreference.findMany({
        where: { userId },
      }),
      db.rollupSettings.findUnique({
        where: { userId },
      }),
      db.gmailSyncState.findUnique({
        where: { userId },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      subscriptions,
      preferences,
      rollupSettings,
      syncState,
    };

    logger.info(`Data export requested for user ${userId}`);

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="prunebox-data-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    logger.error('Data export failed:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
