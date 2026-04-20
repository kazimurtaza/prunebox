import { NextResponse } from 'next/server';
import { signIn } from '@/modules/auth/auth';
import { db } from '@/lib/db';

/**
 * Development-only endpoint to sign in as test user without OAuth
 * This should only be available in development environment
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const testUser = await db.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://github.com/shadcn.png',
      },
    });

    // Create a mock session by setting a cookie
    const response = NextResponse.json({ success: true, user: testUser });

    // Set session cookie (simplified for dev - in production this would be a proper JWT)
    response.cookies.set('next-auth.session-token', 'dev-test-session', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Dev sign-in error:', error);
    return NextResponse.json({ error: 'Sign-in failed' }, { status: 500 });
  }
}
