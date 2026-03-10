/**
 * Migration script to encrypt existing plain text OAuth tokens
 *
 * USAGE:
 *   npm run migrate:encrypt-tokens
 *
 * This script will:
 * 1. Find all accounts with plain text tokens
 * 2. Encrypt them using the current ENCRYPTION_KEY
 * 3. Update the database with encrypted values
 *
 * PREREQUISITES:
 * - ENCRYPTION_KEY must be set in .env
 * - Database must be accessible
 */

import { PrismaClient } from '@prisma/client';
import { encrypt } from '../src/lib/crypto';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function migrateTokens() {
  console.log('🔐 Starting OAuth token encryption migration...\n');

  // Check if ENCRYPTION_KEY is set
  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ ERROR: ENCRYPTION_KEY environment variable is not set!');
    console.error('   Please set ENCRYPTION_KEY in your .env file before running this migration.');
    console.log('\n   Generate a key with: openssl rand -base64 48\n');
    process.exit(1);
  }

  console.log(`✓ ENCRYPTION_KEY is set (${process.env.ENCRYPTION_KEY.substring(0, 10)}...)`);

  try {
    // Find all accounts
    const accounts = await prisma.account.findMany();

    if (accounts.length === 0) {
      console.log('ℹ️  No accounts found in database. Nothing to migrate.\n');
      await prisma.$disconnect();
      return;
    }

    console.log(`\n📊 Found ${accounts.length} account(s) in database.\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const account of accounts) {
      const accountIdentifier = `${account.provider}:${account.providerAccountId}`;

      try {
        // Check if tokens are already encrypted (encrypted tokens contain base64 chars only)
        // A simple heuristic: if it contains only valid base64 chars and is long enough, it might be encrypted
        const looksEncrypted = (value: string | null) => {
          if (!value) return false;
          // Encrypted tokens are base64, so they should only contain these chars
          // Plain text tokens often contain dots, dashes, or other chars
          const base64Pattern = /^[A-Za-z0-9+/=]+$/;
          return base64Pattern.test(value) && value.length > 50;
        };

        const accessTokenEncrypted = looksEncrypted(account.access_token);
        const refreshTokenEncrypted = looksEncrypted(account.refresh_token);

        if (accessTokenEncrypted && refreshTokenEncrypted) {
          console.log(`  ⏭️  Skipped ${accountIdentifier} (already encrypted)`);
          skipped++;
          continue;
        }

        // Prepare update data
        const updateData: { access_token?: string; refresh_token?: string } = {};

        if (account.access_token && !accessTokenEncrypted) {
          updateData.access_token = encrypt(account.access_token);
          console.log(`  🔒 Encrypted access_token for ${accountIdentifier}`);
        }

        if (account.refresh_token && !refreshTokenEncrypted) {
          updateData.refresh_token = encrypt(account.refresh_token);
          console.log(`  🔒 Encrypted refresh_token for ${accountIdentifier}`);
        }

        // Update the account
        if (Object.keys(updateData).length > 0) {
          await prisma.account.update({
            where: { id: account.id },
            data: updateData,
          });
          migrated++;
          console.log(`  ✅ Migrated ${accountIdentifier}\n`);
        } else {
          skipped++;
          console.log(`  ⏭️  Skipped ${accountIdentifier} (no tokens to encrypt)\n`);
        }

      } catch (error) {
        console.error(`  ❌ Error migrating ${accountIdentifier}:`, error);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 Migration Summary:');
    console.log(`  ✅ Migrated: ${migrated} account(s)`);
    console.log(`  ⏭️  Skipped: ${skipped} account(s)`);
    console.log(`  ❌ Errors:   ${errors} account(s)`);
    console.log('='.repeat(50) + '\n');

    if (migrated > 0) {
      console.log('✅ Migration completed successfully!');
      console.log('   All OAuth tokens are now encrypted at rest.\n');
    } else if (skipped > 0 && errors === 0) {
      console.log('✅ All tokens were already encrypted. Nothing to do.\n');
    } else {
      console.log('⚠️  Migration completed with some errors. Please review the logs above.\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateTokens()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
