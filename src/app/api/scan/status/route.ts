
import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';

export async function GET() {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const syncState = await db.gmailSyncState.findUnique({
            where: { userId: session.user.id },
        });

        return NextResponse.json({
            scanStatus: syncState?.scanStatus || 'idle',
            scanProgress: syncState?.scanProgress || 0,
            scanTotal: syncState?.scanTotal || 0,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }
}
