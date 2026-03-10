import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { auth } from '@/modules/auth/auth';

export async function POST(_req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    logger.info(`Resetting scan data for user ${userId}`);

    // Delete all subscriptions for this user
    const deleteResult = await db.subscription.deleteMany({
      where: { userId },
    });

    // Reset sync state - explicitly delete and recreate to ensure null values
    await db.gmailSyncState.deleteMany({
      where: { userId },
    });

    await db.gmailSyncState.create({
      data: {
        userId,
        scanStatus: 'idle',
        scanProgress: 0,
      },
    });

    logger.info(`Reset complete for user ${userId}: deleted ${deleteResult.count} subscriptions`);

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: 'All scan data has been cleared. Your next scan will be a full scan.',
    });
  } catch (error) {
    logger.error(`Reset failed for user:`, error);
    return NextResponse.json(
      { error: 'Failed to reset scan data' },
      { status: 500 }
    );
  }
}
