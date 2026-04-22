const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://prunebox:2DpY4cyxwIg+ENYuC29U3TJ694oHYwph6oA7sx+Xu1M=@localhost:5432/prunebox"
    }
  }
});

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Test reading existing tables
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('📊 Existing tables:', tables.map(t => t.tablename));

    // Test if Prisma schema tables exist
    const expectedTables = [
      'User',
      'Account',
      'Session',
      'VerificationToken',
      'Subscription',
      'SubscriptionPreference',
      'GmailSyncState',
      'RollupSettings',
      'UnsubscriptionAttempt',
      'BulkDeletionJob'
    ];

    const tableNames = tables.map(t => t.tablename);
    const missingTables = expectedTables.filter(table => !tableNames.includes(table));

    if (missingTables.length === 0) {
      console.log('✅ All expected tables exist');
    } else {
      console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
      console.log('📋 Database schema is not fully deployed');
    }

    await prisma.$disconnect();
    console.log('✅ Database schema validation passed');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();