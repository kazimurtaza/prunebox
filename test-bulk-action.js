const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        accounts: {
          create: {
            provider: 'google',
            access_token: 'mock_token',
            refresh_token: 'mock_refresh_token',
            expires_at: Date.now() + 3600000,
            scope: 'gmail.readonly gmail.modify'
          }
        }
      },
      include: {
        accounts: true
      }
    });

    console.log('Test user created:', user.id);
    return user.id;
  } catch (error) {
    console.error('Error creating test user:', error);
    return null;
  }
}

async function createTestSubscriptions(userId) {
  try {
    const subscription1 = await prisma.subscription.create({
      data: {
        userId: userId,
        senderEmail: 'newsletter1@example.com',
        senderName: 'Newsletter 1',
        messageCount: 100,
        confidenceScore: 95,
        recentSubject: 'Latest News',
        recentSnippet: 'Check out our latest updates...',
        unsubscribeUrl: 'https://example.com/unsubscribe'
      }
    });

    const subscription2 = await prisma.subscription.create({
      data: {
        userId: userId,
        senderEmail: 'newsletter2@example.com',
        senderName: 'Newsletter 2',
        messageCount: 150,
        confidenceScore: 90,
        recentSubject: 'Weekly Digest',
        recentSnippet: 'Here are your weekly updates...',
        unsubscribeUrl: 'https://example.com/unsubscribe2'
      }
    });

    console.log('Test subscriptions created:', [subscription1.id, subscription2.id]);
    return [subscription1.id, subscription2.id];
  } catch (error) {
    console.error('Error creating test subscriptions:', error);
    return [];
  }
}

async function main() {
  const userId = await createTestUser();
  if (userId) {
    const subscriptionIds = await createTestSubscriptions(userId);
    console.log('Test data ready. User ID:', userId);
    console.log('Subscription IDs:', subscriptionIds);

    // Print curl commands for testing
    console.log('\nTo test the bulk action API:');
    console.log(`curl -X POST http://localhost:3000/api/subscriptions/bulk \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Cookie: next-auth.session-token=mock_session_token" \\`);
    console.log(`  -d '{"subscriptionIds":["${subscriptionIds[0]}","${subscriptionIds[1]}"],"action":"delete"}'`);
  }
}

main().catch(console.error);