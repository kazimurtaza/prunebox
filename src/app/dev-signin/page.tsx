'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Development-only sign-in page that bypasses OAuth
 * This should only be used in development environment
 */
export default function DevSigninPage() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      router.push('/auth/signin');
      return;
    }

    // Auto sign in as test user
    signIn('dev-test', {
      email: 'test@example.com',
      callbackUrl: '/dashboard',
    }).catch(console.error);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Signing in as test user...</p>
      </div>
    </div>
  );
}
