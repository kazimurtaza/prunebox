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

    const syncState = await db.gmailSyncState.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      scanStatus: syncState?.scanStatus || 'idle',
      scanProgress: syncState?.scanProgress || 0,
      scanTotal: syncState?.scanTotal || 0,
    });
  }, 'Failed to fetch scan status');
}
