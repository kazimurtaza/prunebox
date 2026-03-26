import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { runEmailScan } from '@/modules/queues/jobs';
import { db } from '@/lib/db';
import { ApiErrorResponse, withErrorHandling } from '@/lib/errors';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';
import { getUserTokens } from '@/lib/get-user-tokens';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    logger.debug(`Scan request from user ${session.user.id}`);

    // Apply rate limiting - 1 scan per minute per user
    const rateLimitResponse = await withRateLimit(
      `scan:${session.user.id}`,
      RATE_LIMITS.SCAN
    );

    if (rateLimitResponse) {
      logger.debug(`Scan rate limited for user ${session.user.id}`);
      return rateLimitResponse;
    }

    // Check if already scanning and detect first scan
    const syncState = await db.gmailSyncState.findUnique({
      where: { userId: session.user.id },
    });

    if (syncState?.scanStatus === 'scanning') {
      logger.debug(`Scan already in progress for user ${session.user.id}`);
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

    // Get tokens from database instead of session
    const tokens = await getUserTokens(session.user.id);
    if (!tokens || !tokens.accessToken) {
      return ApiErrorResponse.badRequest('No Gmail account found. Please reconnect your Google account.');
    }

    logger.info(`Starting scan for user ${session.user.id}: firstScan=${isFirstScan}, forceFull=${forceFullScan}`);

    // Fire-and-forget the scan job (progress tracked via db.gmailSyncState)
    runEmailScan({
      userId: session.user.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? undefined,
      forceFullScan,
    }).catch(err => logger.error('Background scan failed:', err));

    return NextResponse.json({ success: true, message: 'Scan started' });
  }, 'Failed to start scan');
}
