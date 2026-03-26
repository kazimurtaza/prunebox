import { db } from '@/lib/db';

export async function getUserTokens(userId: string) {
  const account = await db.account.findFirst({
    where: { userId, provider: 'google' },
  });

  if (!account) {
    return null;
  }

  return {
    accessToken: account.access_token || null,
    refreshToken: account.refresh_token || null,
  };
}
