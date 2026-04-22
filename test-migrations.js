#!/usr/bin/env node

// Simple test to verify database is connected and migrations can be applied
const { PrismaClient } = require('@prisma/client');

// Basic Prisma client without datasources config
const prisma = new PrismaClient();

async function testMigrations() {
  try {
    console.log('Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Check if _prisma_migrations table exists
    const migrationsTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '_prisma_migrations'
      )
    `;

    if (!migrationsTableExists[0].exists) {
      console.log('❌ _prisma_migrations table does not exist');
      console.log('📝 Run migration to create the table');
      return false;
    }

    console.log('✅ _prisma_migrations table exists');

    // Check migration state
    const migrations = await prisma.$queryRaw`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5`;

    if (migrations.length === 0) {
      console.log('⚠️  No migrations found in history');
      console.log('📝 Database may not be fully migrated');
      return false;
    } else {
      console.log('📋 Recent migrations:');
      migrations.forEach(m => {
        console.log(`  - ${m.migration_name} at ${m.finished_at}`);
      });
    }

    // Test if schema tables exist
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
    const tableNames = tables.map(t => t.tablename);

    const expectedTables = [
      'User', 'Account', 'Session', 'VerificationToken',
      'Subscription', 'SubscriptionPreference', 'GmailSyncState',
      'RollupSettings', 'UnsubscriptionAttempt', 'BulkDeletionJob'
    ];

    const missingTables = expectedTables.filter(table => !tableNames.includes(table));

    if (missingTables.length === 0) {
      console.log('✅ All expected tables exist');
      console.log('✅ Database migrations appear to be applied successfully');
      return true;
    } else {
      console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testMigrations().then(success => {
  if (success) {
    console.log('\n🎉 V4 Verification: Database migrations can be applied - PASS');
    process.exit(0);
  } else {
    console.log('\n❌ V4 Verification: Database migrations can be applied - FAIL');
    process.exit(1);
  }
});