import { Worker } from 'bullmq';
import { getConnection, QUEUE_NAMES } from './client';
import { listMessages, getMessage, getMessageHeaders } from '../gmail/client';
import { detectSubscription, parseSender } from '../gmail/detection';
import { db } from '@/lib/db';
import Redis from 'ioredis';

// Get Redis connection for workers
function getWorkerConnection(): Redis {
  const conn = getConnection();
  if (!conn) {
    throw new Error('Redis connection not available. Set REDIS_URL environment variable.');
  }
  return conn;
}

/**
 * Email Scan Worker
 * Scans user's inbox for subscription emails
 */
export function createEmailScanWorker() {
  return new Worker(
    QUEUE_NAMES.EMAIL_SCAN,
    async (job) => {
      const { userId, accessToken, refreshToken, forceFullScan } = job.data as {
        userId: string;
        accessToken: string;
        refreshToken?: string;
        forceFullScan?: boolean;
      };

      console.log(`Starting email scan for user ${userId}`);

      // Update sync state
      await db.gmailSyncState.upsert({
        where: { userId },
        create: {
          userId,
          scanStatus: 'scanning',
          scanProgress: 0,
        },
        update: {
          scanStatus: 'scanning',
          scanProgress: 0,
        },
      });

      try {
        // Build query for subscription emails
        const query = forceFullScan
          ? '-in:spam -in:trash' // Search everywhere except spam and trash
          : '-in:spam -in:trash newer_than:90d (unsubscribe OR "list-id" OR from:noreply OR from:newsletter OR from:marketing OR from:updates)';

        const messageIds = await listMessages(accessToken, refreshToken, query, 5000);
        const totalMessages = messageIds.length;

        console.log(`Found ${totalMessages} messages to scan for user ${userId}`);

        await db.gmailSyncState.update({
          where: { userId },
          data: { scanTotal: totalMessages },
        });

        // Process messages in batches
        const batchSize = 50;
        for (let i = 0; i < messageIds.length; i += batchSize) {
          const batch = messageIds.slice(i, i + batchSize);

          for (const messageId of batch) {
            const message = await getMessage(accessToken, refreshToken, messageId, 'full');

            if (!message) {
              console.log(`Could not fetch message ${messageId}`);
              continue;
            }

            const headers = getMessageHeaders(message);
            const detection = detectSubscription(headers);

            console.log(`Processing message ${messageId}: isSubscription=${detection.isSubscription}, confidence=${detection.confidence}`);

            if (detection.isSubscription && detection.confidence >= 50) {
              const { email: senderEmail, name: senderName } = parseSender(headers['From'] || '');
              console.log(`Found subscription: ${senderEmail} (${senderName})`);

              // Upsert subscription
              await db.subscription.upsert({
                where: {
                  userId_senderEmail: {
                    userId,
                    senderEmail,
                  },
                },
                create: {
                  userId,
                  senderEmail,
                  senderName: senderName || senderEmail.split('@')[0],
                  listUnsubscribeHeader: headers['List-Unsubscribe'],
                  unsubscribeMethod: detection.method,
                  unsubscribeUrl: detection.unsubscribeUrl,
                  unsubscribeMailto: detection.unsubscribeMailto,
                  confidenceScore: detection.confidence,
                  recentSubject: headers['Subject'],
                  recentSnippet: message.snippet,
                },
                update: {
                  messageCount: { increment: 1 },
                  lastSeenAt: new Date(),
                  confidenceScore: { increment: 5 }, // Boost confidence on repeat
                  recentSubject: headers['Subject'],
                  recentSnippet: message.snippet,
                },
              });
            }
          }

          // Update progress
          await db.gmailSyncState.update({
            where: { userId },
            data: { scanProgress: i + batch.length },
          });
        }

        // Mark scan as complete
        await db.gmailSyncState.update({
          where: { userId },
          data: {
            scanStatus: 'idle',
            lastSyncAt: new Date(),
          },
        });

        console.log(`Completed email scan for user ${userId}`);
        return { success: true, subscriptionsFound: totalMessages };
      } catch (error) {
        console.error(`Error in email scan for user ${userId}:`, error);

        await db.gmailSyncState.update({
          where: { userId },
          data: {
            scanStatus: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        throw error;
      }
    },
    { connection: getWorkerConnection(), concurrency: 5 }
  );
}

/**
 * Unsubscribe Worker
 * Processes unsubscription requests
 */
export function createUnsubscribeWorker() {
  return new Worker(
    QUEUE_NAMES.UNSUBSCRIBE,
    async (job) => {
      const { userId, subscriptionId, accessToken, refreshToken } = job.data as {
        userId: string;
        subscriptionId: string;
        accessToken: string;
        refreshToken?: string;
      };

      console.log(`Processing unsubscribe for subscription ${subscriptionId}`);

      // Get subscription details
      const subscription = await db.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription || subscription.userId !== userId) {
        throw new Error('Subscription not found');
      }

      // Record unsubscription attempt
      const attempt = await db.unsubscriptionAttempt.create({
        data: {
          userId,
          subscriptionId,
          method: subscription.unsubscribeMethod,
          status: 'pending',
        },
      });

      try {
        // Import attemptUnsubscribe
        const { attemptUnsubscribe } = await import('../gmail/unsubscribe');

        const result = await attemptUnsubscribe(
          accessToken,
          refreshToken,
          subscription.unsubscribeUrl || undefined,
          subscription.unsubscribeMailto || undefined,
          subscription.unsubscribeMethod as any
        );

        if (result.success) {
          await db.unsubscriptionAttempt.update({
            where: { id: attempt.id },
            data: { status: 'success', completedAt: new Date() },
          });

          return { success: true };
        } else {
          await db.unsubscriptionAttempt.update({
            where: { id: attempt.id },
            data: { status: 'failed', errorMessage: result.error },
          });

          return { success: false, error: result.error };
        }
      } catch (error) {
        await db.unsubscriptionAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        throw error;
      }
    },
    { connection: getWorkerConnection() }
  );
}

/**
 * Bulk Delete Worker
 * Deletes all messages from a specific sender
 */
export function createBulkDeleteWorker() {
  return new Worker(
    QUEUE_NAMES.BULK_DELETE,
    async (job) => {
      const { userId, senderEmail, accessToken, refreshToken } = job.data as {
        userId: string;
        senderEmail: string;
        accessToken: string;
        refreshToken?: string;
      };

      console.log(`Starting bulk delete for ${senderEmail}`);

      // Create job record
      const deleteJob = await db.bulkDeletionJob.create({
        data: {
          userId,
          senderEmail,
          status: 'running',
          totalMessages: 0,
        },
      });

      try {
        // Import functions
        const { listMessages, batchDeleteMessages } = await import('../gmail/client');

        // Find all messages from this sender
        const query = `from:${senderEmail}`;
        const messageIds = await listMessages(accessToken, refreshToken, query);

        await db.bulkDeletionJob.update({
          where: { id: deleteJob.id },
          data: { totalMessages: messageIds.length },
        });

        // Delete in batches
        const { batchDeleteMessages: deleteMessages } = await import('../gmail/client');
        await deleteMessages(accessToken, refreshToken, messageIds);

        await db.bulkDeletionJob.update({
          where: { id: deleteJob.id },
          data: {
            status: 'completed',
            deletedMessages: messageIds.length,
            completedAt: new Date(),
          },
        });

        console.log(`Deleted ${messageIds.length} messages from ${senderEmail}`);
        return { success: true, deletedCount: messageIds.length };
      } catch (error) {
        await db.bulkDeletionJob.update({
          where: { id: deleteJob.id },
          data: {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        throw error;
      }
    },
    { connection: getWorkerConnection(), concurrency: 2 }
  );
}

/**
 * Rollup Digest Worker
 * Generates and sends daily digest emails
 */
export function createRollupWorker() {
  return new Worker(
    QUEUE_NAMES.ROLLUP,
    async (job) => {
      const { userId, accessToken, refreshToken } = job.data as {
        userId: string;
        accessToken: string;
        refreshToken?: string;
      };

      console.log(`Generating rollup digest for user ${userId}`);

      try {
        // Get user's rollup settings
        const settings = await db.rollupSettings.findUnique({
          where: { userId },
        });

        if (!settings || !settings.enabled) {
          return { success: false, error: 'Rollup not enabled' };
        }

        // Get subscriptions marked for rollup
        const preferences = await db.subscriptionPreference.findMany({
          where: {
            userId,
            action: 'rollup',
          },
          include: {
            subscription: true,
          },
        });

        if (preferences.length === 0) {
          return { success: true, message: 'No subscriptions in rollup' };
        }

        // Collect recent emails from each subscription
        const digestContent: Array<{
          senderName: string;
          senderEmail: string;
          subjects: string[];
        }> = [];

        for (const pref of preferences) {
          const { listMessages, getMessage } = await import('../gmail/client');
          const { getMessageHeaders } = await import('../gmail/client');

          const messageIds = await listMessages(
            accessToken,
            refreshToken,
            `from:${pref.subscription.senderEmail} newer_than:1d`,
            10
          );

          const subjects: string[] = [];
          for (const msgId of messageIds) {
            const msg = await getMessage(accessToken, refreshToken, msgId, 'minimal');
            if (msg?.payload?.headers) {
              const headers = getMessageHeaders(msg);
              subjects.push(headers['Subject'] || '(No subject)');
            }
          }

          if (subjects.length > 0) {
            digestContent.push({
              senderName: pref.subscription.senderName || pref.subscription.senderEmail,
              senderEmail: pref.subscription.senderEmail,
              subjects,
            });
          }
        }

        if (digestContent.length === 0) {
          return { success: true, message: 'No new emails for rollup' };
        }

        // Generate digest HTML
        let digestHtml = `
          <h2>${settings.digestName}</h2>
          <p>Your daily digest of rolled up subscriptions.</p>
        `;

        for (const item of digestContent) {
          digestHtml += `
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0;">${item.senderName} (${item.subjects.length} emails)</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${item.subjects.map((s) => `<li>${s}</li>`).join('')}
              </ul>
            </div>
          `;
        }

        // Send digest email
        const { sendEmail } = await import('../gmail/client');
        await sendEmail(
          accessToken,
          refreshToken,
          '', // Send to self
          `${settings.digestName} - ${new Date().toLocaleDateString()}`,
          digestHtml
        );

        await db.rollupSettings.update({
          where: { userId },
          data: { lastSentAt: new Date() },
        });

        return { success: true, digestSize: digestContent.length };
      } catch (error) {
        console.error(`Error generating rollup for user ${userId}:`, error);
        throw error;
      }
    },
    { connection: getWorkerConnection() }
  );
}
