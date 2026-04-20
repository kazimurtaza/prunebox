import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/lib/db';

/**
 * Development-only authentication callback
 * POST /api/dev-auth/callback will sign in the test user and redirect to dashboard
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    // Get or create test user
    const user = await db.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://github.com/shadcn.png',
      },
    });

    // Get or create account for credentials provider
    await db.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'credentials',
          providerAccountId: user.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: user.id,
      },
    });

    // Get or create session
    const session = await db.session.upsert({
      where: { sessionToken: `dev-test-${user.id}` },
      update: {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      create: {
        sessionToken: `dev-test-${user.id}`,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Create response with session cookie
    const response = NextResponse.json({ success: true, redirect: '/dashboard' });

    // Set NextAuth session cookies
    response.cookies.set('next-auth.session-token', session.sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set('__Secure-next-auth.session-token', session.sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Dev auth callback error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
