import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { queueEmailScan } from '@/modules/queues';
import { db } from '@/lib/db';
import { ApiErrorResponse, withErrorHandling } from '@/lib/errors';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    // Apply rate limiting - 1 scan per minute per user
    const rateLimitResponse = await withRateLimit(
      `scan:${session.user.id}`,
      RATE_LIMITS.SCAN
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    if (!session.accessToken) {
      return ApiErrorResponse.badRequest('No Gmail access token');
    }

    // Check if already scanning and detect first scan
    const syncState = await db.gmailSyncState.findUnique({
      where: { userId: session.user.id },
    });

    if (syncState?.scanStatus === 'scanning') {
      return ApiErrorResponse.conflict('Scan already in progress');
    }

    // Detect if this is a first scan (no sync state or never synced before)
    const isFirstScan = !syncState || !syncState.lastSyncAt;

    let forceFullScan = false;
    try {
      const body = await request.json();
      forceFullScan = !!body.forceFullScan;
    } catch {
      // Body might be empty
    }

    // Always do full scan on first scan (after reset or new user)
    if (isFirstScan) {
      forceFullScan = true;
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
