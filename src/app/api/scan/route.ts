import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { queueEmailScan } from '@/modules/queues';
import { db } from '@/lib/db';
import { ApiErrorResponse, withErrorHandling, ErrorType } from '@/lib/errors';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    if (!session.accessToken) {
      return ApiErrorResponse.badRequest('No Gmail access token');
    }

    // Check if already scanning
    const syncState = await db.gmailSyncState.findUnique({
      where: { userId: session.user.id },
    });

    if (syncState?.scanStatus === 'scanning') {
      return ApiErrorResponse.conflict('Scan already in progress');
    }

    let forceFullScan = false;
    try {
      const body = await request.json();
      forceFullScan = !!body.forceFullScan;
    } catch {
      // Body might be empty
    }

    // Queue the scan job
    await queueEmailScan({
      userId: session.user.id,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      forceFullScan,
    });

    return NextResponse.json({ success: true, message: 'Scan started' });
  }, 'Failed to start scan');
}
