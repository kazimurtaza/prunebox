import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

export const authConfig: NextAuthConfig = {
  providers: [
    // Development-only credentials provider for testing
    ...(process.env.NODE_ENV === 'development'
      ? [
          Credentials({
            id: 'dev-test',
            name: 'Dev Test',
            credentials: {
              email: { label: 'Email', type: 'email' },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;

              // Only allow the test user
              if (credentials.email !== 'test@example.com') return null;

              const user = await db.user.upsert({
                where: { email: 'test@example.com' },
                update: {},
                create: {
                  email: 'test@example.com',
                  name: 'Test User',
                  image: 'https://github.com/shadcn.png',
                },
              });

              return user;
            },
          }),
        ]
      : []),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          // Request all Gmail scopes we need
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.labels',
            'https://www.googleapis.com/auth/gmail.send',
          ].join(' '),
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      // Prevent account linking: Only allow sign-in if the email matches
      // This ensures each Google account creates/uses its own user record
      if (account?.provider === 'google' && profile) {
        const googleEmail = profile.email;

        // If user exists but email doesn't match the Google account email, deny sign-in
        // This prevents account linking between different Google accounts
        if (user && user.email !== googleEmail) {
          logger.warn('Account linking prevented', {
            userEmail: user.email,
            googleEmail: googleEmail,
          });
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, user, profile }) {
      // Initial sign in - store the access token and refresh token
      if (user) {
        token.id = user.id;
        token.email = user.email; // Store the email from the user
      }
      if (account) {
        token.expiresAt = account.expires_at;
        token.provider = account.provider;
      }
      // Store the current Google account email for display
      if (profile?.email) {
        token.currentEmail = profile.email;
      }

      return token;
    },
    async session({ session, token }) {
      // Add user info to the session
      if (token && session.user) {
        session.user.id = token.id as string;
        // Use the current account email if available, otherwise fall back to user email
        session.user.email = (token.currentEmail as string) || session.user.email;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
};
