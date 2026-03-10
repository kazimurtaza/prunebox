import { Worker } from 'bullmq';
import { QUEUE_NAMES, BulkDeleteJobData, RollupJobData } from './client';
import { listMessages, getMessage, getMessageHeaders, batchDeleteMessages, sendEmail, InvalidTokenError } from '../gmail/client';
import { detectSubscription, parseSender } from '../gmail/detection';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import Redis from 'ioredis';

// Get Redis connection for workers - creates a separate connection for workers
// to avoid conflicts with queue producers
function getWorkerConnection(): Redis {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('Redis connection not available. Set REDIS_URL environment variable.');
  }

  // Create a NEW connection for workers (separate from queue producers)
  // This avoids BullMQ connection conflicts
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });
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

      logger.info(`Starting email scan for user ${userId}`);

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
        // Detect if this is the first scan
        const syncState = await db.gmailSyncState.findUnique({
          where: { userId },
        });

        const isFirstScan = !syncState || !syncState.lastSyncAt;

        // If it's the first scan, always do a full scan (unlimited)
        // This gives users complete data on their first run
        const effectiveForceFullScan = isFirstScan || forceFullScan;

        // For subsequent scans, get the most recent email date for incremental scanning
        let lastEmailDate: Date | undefined;
        if (!isFirstScan) {
          const latestSubscription = await db.subscription.findFirst({
            where: { userId },
            orderBy: { lastSeenAt: 'desc' },
            select: { lastSeenAt: true },
          });

          if (latestSubscription?.lastSeenAt) {
            // Add 1-day buffer to catch any emails that arrived during previous scan
            lastEmailDate = new Date(latestSubscription.lastSeenAt);
            lastEmailDate.setDate(lastEmailDate.getDate() - 1);
          }
        }

        // Build query
        const baseQuery = '-in:spam -in:trash -in:sent';
        const dateQuery = lastEmailDate
          ? ` newer_than:${lastEmailDate.toISOString().split('T')[0].replace(/-/g, '/')}`
          : '';

        const query = effectiveForceFullScan
          ? baseQuery
          : baseQuery + dateQuery;

        // Only limit non-full scans
        const defaultMaxScan = parseInt(process.env.MAX_EMAIL_SCAN_LIMIT || '1000', 10);
        const maxMessagesToScan = effectiveForceFullScan ? undefined : defaultMaxScan;

        if (effectiveForceFullScan) {
          logger.info(`Starting ${isFirstScan ? 'FIRST TIME ' : ''}FULL inbox scan for user ${userId} (unlimited)`);
        } else if (lastEmailDate) {
          logger.info(`Scanning emails newer than ${lastEmailDate.toISOString().split('T')[0]} for user ${userId}`);
        } else {
          logger.info(`Scanning up to ${maxMessagesToScan} messages for user ${userId}`);
        }

        const messageIds = await listMessages(accessToken, refreshToken, query, maxMessagesToScan, userId);
        const totalMessages = messageIds.length;

        logger.debug(`Found ${totalMessages} messages to scan for user ${userId}`);

        await db.gmailSyncState.update({
          where: { userId },
          data: { scanTotal: totalMessages },
        });

        // Track message counts per sender for this scan
        const senderMessageCounts = new Map<string, number>();
        const senderData = new Map<string, {
          senderName: string;
          listUnsubscribeHeader: string | undefined;
          unsubscribeMethod: string;
          unsubscribeUrl: string | undefined;
          unsubscribeMailto: string | undefined;
          confidenceScore: number;
          recentSubject: string | undefined;
          recentSnippet: string | undefined;
        }>();

        // Process messages in batches with parallel processing
        const batchSize = 50;
        const parallelism = 10; // Process up to 10 messages concurrently within each batch

        for (let i = 0; i < messageIds.length; i += batchSize) {
          const batch = messageIds.slice(i, i + batchSize);

          // Process batch in chunks for parallel execution
          for (let j = 0; j < batch.length; j += parallelism) {
            const chunk = batch.slice(j, j + parallelism);

            // Process messages in parallel
            await Promise.all(chunk.map(async (messageId) => {
              try {
                const message = await getMessage(accessToken, refreshToken, messageId, 'full', userId);

                if (!message) {
                  logger.warn(`Could not fetch message ${messageId}`);
                  return;
                }

                const headers = getMessageHeaders(message);
                const detection = detectSubscription(headers);

                logger.debug(`Processing message ${messageId}: isSubscription=${detection.isSubscription}, confidence=${detection.confidence}`);

                // Validate confidence score is a number
                if (typeof detection.confidence !== 'number' || isNaN(detection.confidence)) {
                  logger.error(`Invalid confidence score for message ${messageId}:`, {
                    confidence: detection.confidence,
                    type: typeof detection.confidence,
                    from: headers['From'],
                    subject: headers['Subject']
                  });
                  return; // Skip this message
                }

                // Store ALL senders (not just subscriptions) so users can manage all their emails
                const { email: senderEmail, name: senderName } = parseSender(headers['From'] || '');

                if (!senderEmail) {
                  logger.warn(`Could not parse sender from: ${headers['From']}`);
                  return;
                }

                const cappedConfidence = Math.min(detection.confidence, 100);

                // Count messages per sender and store latest data
                const currentCount = senderMessageCounts.get(senderEmail) || 0;
                senderMessageCounts.set(senderEmail, currentCount + 1);

                // Store the most recent message data for this sender
                // Only update if we don't have data yet, or if this message is more recent
                if (!senderData.has(senderEmail)) {
                  senderData.set(senderEmail, {
                    senderName: senderName || senderEmail.split('@')[0],
                    listUnsubscribeHeader: headers['List-Unsubscribe'],
                    unsubscribeMethod: detection.method || 'none',
                    unsubscribeUrl: detection.unsubscribeUrl,
                    unsubscribeMailto: detection.unsubscribeMailto,
                    confidenceScore: cappedConfidence,
                    recentSubject: headers['Subject'],
                    recentSnippet: message.snippet,
                  });
                }
              } catch (error) {
                logger.error(`Error processing message ${messageId}:`, error);
              }
            }));
          }

          // Update progress
          await db.gmailSyncState.update({
            where: { userId },
            data: { scanProgress: i + batch.length },
          });
        }

        // Update subscriptions with actual counts from this scan
        for (const [senderEmail, count] of senderMessageCounts.entries()) {
          const data = senderData.get(senderEmail)!;

          const existingSubscription = await db.subscription.findUnique({
            where: {
              userId_senderEmail: {
                userId,
                senderEmail,
              },
            },
          });

          if (existingSubscription) {
            // Update with actual count from this scan
            await db.subscription.update({
              where: { id: existingSubscription.id },
              data: {
                listUnsubscribeHeader: data.listUnsubscribeHeader,
                unsubscribeMethod: data.unsubscribeMethod,
                unsubscribeUrl: data.unsubscribeUrl,
                unsubscribeMailto: data.unsubscribeMailto,
                confidenceScore: data.confidenceScore,
                messageCount: count, // Actual count from this scan
                recentSubject: data.recentSubject,
                recentSnippet: data.recentSnippet,
                lastSeenAt: new Date(),
              },
            });
          } else {
            // Create new subscription
            await db.subscription.create({
              data: {
                userId,
                senderEmail,
                senderName: data.senderName,
                listUnsubscribeHeader: data.listUnsubscribeHeader,
                unsubscribeMethod: data.unsubscribeMethod,
                unsubscribeUrl: data.unsubscribeUrl,
                unsubscribeMailto: data.unsubscribeMailto,
                confidenceScore: data.confidenceScore,
                messageCount: count, // Actual count from this scan
                recentSubject: data.recentSubject,
                recentSnippet: data.recentSnippet,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
              },
            });
          }
        }

        // For subscriptions not found in this scan, preserve their messageCount
        // (don't reset to 0 - they might have been in previous full scan)
        // Only update lastSeenAt to keep subscriptions fresh
        const allSubscriptions = await db.subscription.findMany({
          where: { userId },
        });

        for (const subscription of allSubscriptions) {
          if (!senderMessageCounts.has(subscription.senderEmail)) {
            // Subscription exists but wasn't found in this scan
            // Preserve existing messageCount (don't reset to 0)
            // Only update lastSeenAt to keep subscription data fresh
            await db.subscription.update({
              where: { id: subscription.id },
              data: {
                // messageCount remains unchanged - preserves historical data
                lastSeenAt: new Date(),
              },
            });
          }
        }

        // Mark scan as complete
        await db.gmailSyncState.update({
          where: { userId },
          data: {
            scanStatus: 'idle',
            lastSyncAt: new Date(),
          },
        });

        logger.info(`Completed email scan for user ${userId}`);
        return { success: true, subscriptionsFound: totalMessages };
      } catch (error) {
        logger.error(`Error in email scan for user ${userId}:`, error);

        // Check for invalid/revoked token
        if (error instanceof InvalidTokenError) {
          await db.gmailSyncState.update({
            where: { userId },
            data: {
              scanStatus: 'error',
              errorMessage: 'Your Google account access has expired. Please reconnect your account.',
              lastSyncAt: new Date(),
            },
          });
          throw error;
        }

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

      logger.info(`Processing unsubscribe for subscription ${subscriptionId}`);

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

        // Skip unsubscription if method is 'none'
        if (subscription.unsubscribeMethod === 'none') {
          await db.unsubscriptionAttempt.update({
            where: { id: attempt.id },
            data: {
              status: 'failed',
              errorMessage: 'No unsubscribe method available for this subscription',
            },
          });
          return;
        }

        const result = await attemptUnsubscribe(
          accessToken,
          refreshToken,
          subscription.unsubscribeUrl || undefined,
          subscription.unsubscribeMailto || undefined,
          subscription.unsubscribeMethod as 'one_click' | 'mailto' | 'http' | 'manual'
        );

        if (result.success) {
          await db.unsubscriptionAttempt.update({
            where: { id: attempt.id },
            data: { status: 'success', completedAt: new Date() },
          });
        } else {
          await db.unsubscriptionAttempt.update({
            where: { id: attempt.id },
            data: { status: 'failed', errorMessage: result.error || 'Unknown error' },
          });
        }
      } catch (error) {
        logger.error(`Unsubscribe failed for ${subscriptionId}:`, error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isTokenError = error instanceof InvalidTokenError ||
                            errorMessage.includes('invalid_grant') ||
                            errorMessage.includes('Token has been expired');

        await db.unsubscriptionAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'error',
            errorMessage: isTokenError
              ? 'Google account access expired. Please reconnect your account.'
              : errorMessage
          },
        });

        // Also update sync state for token errors
        if (isTokenError) {
          await db.gmailSyncState.update({
            where: { userId },
            data: {
              scanStatus: 'error',
              errorMessage: 'Your Google account access has expired. Please reconnect your account.',
            },
          });
        }

        throw error;
      }
    },
    { connection: getWorkerConnection(), concurrency: 5 }
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
      logger.info(`Bulk delete job received:`, job.data);

      const { userId, senderEmail } = job.data as BulkDeleteJobData;

      logger.info(`Starting bulk delete for ${senderEmail}`);

      try {
        // Fetch fresh tokens from database to avoid stale token issues
        const account = await db.account.findFirst({
          where: {
            userId,
            provider: 'google',
          },
        });

        if (!account || !account.access_token) {
          throw new Error('No valid Google account found');
        }

        let accessToken = account.access_token;
        let refreshToken = account.refresh_token ?? undefined;

        // Build a broader search query to catch all sender variants
        // Gmail search supports multiple from: patterns with OR
        const domain = senderEmail.includes('@') ? senderEmail.split('@')[1] : senderEmail;

        // Try multiple search patterns to catch variants
        const searchPatterns = [
          senderEmail,                    // Exact match
          domain,                           // Domain only (Gmail auto-matches *@domain)
        ];

        // Collect all unique message IDs from all search patterns
        const allMessageIds = new Set<string>();
        for (const pattern of searchPatterns) {
          const query = `from:${pattern}`;
          const ids = await listMessages(accessToken, refreshToken, query, 5000, userId);
          ids.forEach(id => allMessageIds.add(id));
        }

        const messageIds = Array.from(allMessageIds);

        if (messageIds.length === 0) {
          logger.info(`No messages found from ${senderEmail}`);
          return { success: true, deletedCount: 0 };
        }

        logger.info(`Found ${messageIds.length} messages from ${senderEmail}, deleting...`);

        // Delete messages in batches with retry on credential errors
        let deletedCount = 0;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            await batchDeleteMessages(accessToken, refreshToken, messageIds, userId);
            deletedCount = messageIds.length;
            lastError = null;
            break; // Success, exit retry loop
          } catch (error) {
            lastError = error as Error | null;
            const err = error as { message?: string } | null;
            if (attempt === 1 && err?.message?.includes('Invalid Credentials')) {
              logger.info(`Token expired for ${senderEmail}, refreshing and retrying...`);
              // Fetch fresh tokens and retry
              const freshAccount = await db.account.findFirst({
                where: {
                  userId,
                  provider: 'google',
                },
              });
              if (freshAccount?.access_token) {
                accessToken = freshAccount.access_token;
                refreshToken = freshAccount.refresh_token ?? undefined;
                continue; // Retry with fresh tokens
              }
            }
            throw error;
          }
        }

        if (lastError) {
          throw lastError;
        }

        logger.info(`Deleted ${deletedCount} messages from ${senderEmail}`);

        return { success: true, deletedCount: messageIds.length };
      } catch (error) {
        logger.error(`Bulk delete failed for ${senderEmail}:`, error);
        throw error;
      }
    },
    { connection: getWorkerConnection(), concurrency: 3 }
  );
}

/**
 * Rollup Worker
 * Sends a digest email with all subscriptions
 */
export function createRollupWorker() {
  return new Worker(
    QUEUE_NAMES.ROLLUP,
    async (job) => {
      const { userId, accessToken, refreshToken } = job.data as RollupJobData;

      logger.info(`Starting rollup digest for user ${userId}`);

      try {
        // Get all subscriptions for this user
        const subscriptions = await db.subscription.findMany({
          where: { userId },
          orderBy: { senderName: 'asc' },
        });

        if (subscriptions.length === 0) {
          logger.info(`No subscriptions found for user ${userId}`);
          return { success: true, subscriptionCount: 0 };
        }

        // Build digest email
        const subject = `Your Prunebox Subscription Digest (${subscriptions.length} subscriptions)`;
        const body = [
          `You have ${subscriptions.length} subscriptions in Prunebox:\n`,
          ...subscriptions.map((sub, i) => {
            const unsubscribeInfo = sub.unsubscribeUrl
              ? `\n   Unsubscribe: ${sub.unsubscribeUrl}`
              : sub.unsubscribeMailto
              ? `\n   Unsubscribe via email: ${sub.unsubscribeMailto}`
              : '';

            return `${i + 1}. ${sub.senderName} (${sub.senderEmail})${unsubscribeInfo}`;
          }),
          `\n---\n`,
          `Manage your subscriptions at https://prunebox.app/dashboard`,
        ].join('\n');

        // Send digest to user's email
        // First, get the user's email
        const user = await db.user.findUnique({
          where: { id: userId },
        });

        if (!user?.email) {
          throw new Error('User email not found');
        }

        await sendEmail(accessToken, refreshToken, user.email, subject, body);

        logger.info(`Sent rollup digest to ${user.email} with ${subscriptions.length} subscriptions`);

        return { success: true, subscriptionCount: subscriptions.length };
      } catch (error) {
        logger.error(`Rollup digest failed for user ${userId}:`, error);
        throw error;
      }
    },
    { connection: getWorkerConnection(), concurrency: 2 }
  );
}
