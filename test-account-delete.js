const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


async function testAccountDelete() {
  // Create test user
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
    },
    include: {
      accounts: true,
      sessions: true,
      subscriptions: true,
      preferences: true,
      unsubscriptionAttempts: true,
      bulkDeletionJobs: true,
      rollupSettings: true,
    }
  });

  console.log('Created test user with ID:', testUser.id);
  console.log('Initial user data:', {
    accounts: testUser.accounts.length,
    sessions: testUser.sessions.length,
    subscriptions: testUser.subscriptions.length,
    preferences: testUser.preferences.length,
    unsubscriptionAttempts: testUser.unsubscriptionAttempts.length,
    bulkDeletionJobs: testUser.bulkDeletionJobs.length,
    rollupSettings: !!testUser.rollupSettings
  });

  // Now simulate the account deletion
  await prisma.user.delete({
    where: { id: testUser.id }
  });

  console.log('User deleted. Checking related records...');

  // Verify cascade deletion
  const accountsCount = await prisma.account.count({
    where: { userId: testUser.id }
  });

  const sessionsCount = await prisma.session.count({
    where: { userId: testUser.id }
  });

  const subscriptionsCount = await prisma.subscription.count({
    where: { userId: testUser.id }
  });

  const preferencesCount = await prisma.subscriptionPreference.count({
    where: { userId: testUser.id }
  });

  const unsubscriptionAttemptsCount = await prisma.unsubscriptionAttempt.count({
    where: { userId: testUser.id }
  });

  const bulkDeletionJobsCount = await prisma.bulkDeletionJob.count({
    where: { userId: testUser.id }
  });

  const rollupSettingsCount = await prisma.rollupSettings.count({
    where: { userId: testUser.id }
  });

  console.log('Cascade deletion results:', {
    accounts: accountsCount,
    sessions: sessionsCount,
    subscriptions: subscriptionsCount,
    preferences: preferencesCount,
    unsubscriptionAttempts: unsubscriptionAttemptsCount,
    bulkDeletionJobs: bulkDeletionJobsCount,
    rollupSettings: rollupSettingsCount
  });

  // Should all be 0 if cascade works correctly
  if (accountsCount === 0 && sessionsCount === 0 && subscriptionsCount === 0 &&
      preferencesCount === 0 && unsubscriptionAttemptsCount === 0 &&
      bulkDeletionJobsCount === 0 && rollupSettingsCount === 0) {
    console.log('✅ SUCCESS: All related data was cascade deleted');
  } else {
    console.log('❌ FAILED: Some related data remains');
  }

  await prisma.$disconnect();
}

testAccountDelete().catch(console.error);