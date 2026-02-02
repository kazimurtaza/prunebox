import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { queueEmailScan } from '@/modules/queues';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.accessToken) {
    return NextResponse.json({ error: 'No Gmail access token' }, { status: 400 });
  }

  try {
    // Check if already scanning
    const syncState = await db.gmailSyncState.findUnique({
      where: { userId: session.user.id },
    });

    if (syncState?.scanStatus === 'scanning') {
      return NextResponse.json({ error: 'Scan already in progress' }, { status: 409 });
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
  } catch (error) {
    console.error('Error starting scan:', error);
    return NextResponse.json({ error: 'Failed to start scan' }, { status: 500 });
  }
}
