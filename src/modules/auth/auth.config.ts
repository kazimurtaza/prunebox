import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { logger } from '@/lib/logger';

export const authConfig: NextAuthConfig = {
  providers: [
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
    async jwt({ token, account, user }) {
      logger.debug('JWT Callback', { hasUser: !!user, hasAccount: !!account });
      // Initial sign in - store the access token and refresh token
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.provider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      logger.debug('Session Callback', { hasToken: !!token });
      // Add the access token and refresh token to the session
      if (token && session.user) {
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.user.id = token.id as string;
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
