import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getEncryptionKey } from '@/lib/crypto';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    getEncryptionKey();
    return NextResponse.json({ status: 'healthy', database: 'connected', encryption: 'configured' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
      return NextResponse.json(
        { status: 'unhealthy', encryption: 'misconfigured', error: error.message },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { status: 'unhealthy', database: 'disconnected' },
      { status: 503 }
    );
  }
}
