import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import { authConfig } from './auth.config';

// Validate NEXTAUTH_URL in development to prevent production domain usage
if (process.env.NODE_ENV === 'development') {
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (nextAuthUrl && !nextAuthUrl.includes('localhost') && !nextAuthUrl.includes('127.0.0.1')) {
    console.warn('⚠️ WARNING: NEXTAUTH_URL is not set to localhost in development. OAuth callbacks may fail.');
    console.warn(`   Current NEXTAUTH_URL: ${nextAuthUrl}`);
    console.warn('   Expected: http://localhost:3000');
  }
  if (appUrl && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1')) {
    console.warn('⚠️ WARNING: NEXT_PUBLIC_APP_URL is not set to localhost in development.');
    console.warn(`   Current NEXT_PUBLIC_APP_URL: ${appUrl}`);
    console.warn('   Expected: http://localhost:3000');
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: true,
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
});

// Type extensions for next-auth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}
