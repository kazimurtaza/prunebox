-- Insert a test user
INSERT INTO "User" (id, email, name, "emailVerified", image, "createdAt", "updatedAt")
VALUES (
  'test-user-id',
  'test@example.com',
  'Test User',
  NOW(),
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = 'Test User',
  "updatedAt" = NOW();

-- Insert a test account
INSERT INTO "Account" (id, "userId", provider, "providerAccountId", type, access_token, refresh_token, expires_at, token_type, scope, id_token, session_state)
VALUES (
  'test-account-id',
  'test-user-id',
  'google',
  'test-account-provider-id',
  'oauth',
  'mock-access-token',
  'mock-refresh-token',
  EXTRACT(EPOCH FROM NOW() + INTERVAL '1 hour') * 1000,
  'Bearer',
  'gmail.readonly gmail.modify',
  NULL,
  NULL
)
ON CONFLICT (provider, "providerAccountId") DO UPDATE SET
  access_token = 'mock-access-token',
  refresh_token = 'mock-refresh-token',
  expires_at = EXTRACT(EPOCH FROM NOW() + INTERVAL '1 hour') * 1000,
  "updatedAt" = NOW();

-- Insert test subscriptions
INSERT INTO "Subscription" (id, "userId", "senderEmail", "senderName", "messageCount", confidenceScore, "recentSubject", "recentSnippet", "unsubscribeUrl", "createdAt", "updatedAt")
VALUES
  (
    'sub-1',
    'test-user-id',
    'newsletter1@example.com',
    'Newsletter 1',
    100,
    95,
    'Latest News',
    'Check out our latest updates...',
    'https://example.com/unsubscribe1',
    NOW(),
    NOW()
  ),
  (
    'sub-2',
    'test-user-id',
    'newsletter2@example.com',
    'Newsletter 2',
    150,
    90,
    'Weekly Digest',
    'Here are your weekly updates...',
    'https://example.com/unsubscribe2',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;