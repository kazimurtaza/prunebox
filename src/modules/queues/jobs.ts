import { listMessages, getMessage, getMessageHeaders, batchDeleteMessages, sendEmail, createGmailClient, InvalidTokenError, listHistory, getCurrentHistoryId } from '../gmail/client';
import { detectSubscription, parseSender } from '../gmail/detection';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Job data types
export interface EmailScanJobData {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  forceFullScan?: boolean;
}

export interface UnsubscribeJobData {
  userId: string;
  subscriptionId: string;
  accessToken: string;
  refreshToken?: string;
}

export interface RollupJobData {
  userId: string;
  accessToken: string;
  refreshToken?: string;
}

export interface BulkDeleteJobData {
  userId: string;
  senderEmail: string;
  accessToken: string;
  refreshToken?: string;
}

export interface HistoryMonitorJobData {
  userId: string;
}

/**
 * Email Scan Job
 * Scans user's inbox for subscription emails
 */
export async function runEmailScan(data: EmailScanJobData) {
  const { userId, accessToken, refreshToken, forceFullScan } = data;
  const scanStart = Date.now();

  logger.info(`Starting email scan for user ${userId}`);

  // Update sync state and capture result to avoid a redundant findUnique
  const upsertedSync = await db.gmailSyncState.upsert({
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
    // Derive isFirstScan from the upsert result (no extra query needed)
    const isFirstScan = !upsertedSync.lastSyncAt;

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

    // Only limit non-full scans; full scans are uncapped by default
    // but can be limited via MAX_FULL_SCAN_LIMIT env var for self-hosters
    const defaultMaxScan = parseInt(process.env.MAX_EMAIL_SCAN_LIMIT || '1000', 10);
    const fullScanLimit = process.env.MAX_FULL_SCAN_LIMIT
      ? parseInt(process.env.MAX_FULL_SCAN_LIMIT, 10)
      : undefined;
    const maxMessagesToScan = effectiveForceFullScan ? fullScanLimit : defaultMaxScan;

    if (effectiveForceFullScan) {
      logger.info(`Starting ${isFirstScan ? 'FIRST TIME ' : ''}FULL inbox scan for user ${userId}${fullScanLimit ? ` (up to ${fullScanLimit})` : ''}`);
    } else if (lastEmailDate) {
      logger.info(`Scanning emails newer than ${lastEmailDate.toISOString().split('T')[0]} for user ${userId}`);
    } else {
      logger.info(`Scanning up to ${maxMessagesToScan} messages for user ${userId}`);
    }

    const messageIds = await listMessages(accessToken, refreshToken, query, maxMessagesToScan, userId);
    const totalMessages = messageIds.length;

    // Create a single Gmail client for the entire scan job (avoids per-message client churn)
    const gmailClient = await createGmailClient(accessToken, refreshToken, userId);

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
            const message = await getMessage(accessToken, refreshToken, messageId, 'full', userId, gmailClient);

            if (!message) {
              logger.warn(`Could not fetch message ${messageId}`);
              return;
            }

            const headers = getMessageHeaders(message);
            const detection = detectSubscription(headers, message);

            logger.debug(`Processing message ${messageId}: isSubscription=${detection.isSubscription}, confidence=${detection.confidence}`);

            // Validate confidence score is a number
            if (typeof detection.confidence !== 'number' || isNaN(detection.confidence)) {
              logger.error(`Invalid confidence score for message ${messageId}:`, {
                confidence: detection.confidence,
                type: typeof detection.confidence,
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

            // Always use the latest message data — later messages may have better
            // unsubscribe headers (e.g., RFC 8058 one-click) than earlier ones.
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

      logger.debug(`Batch progress: ${Math.min(i + batch.length, totalMessages)}/${totalMessages} messages processed, ${senderMessageCounts.size} unique senders so far`);
    }

    // Batch update/create subscriptions — avoids N+1 individual writes
    const scannedEmails = new Set(senderMessageCounts.keys());
    const dbStart = Date.now();

    // Fetch existing subscriptions for this user in a single query
    const existingSubs = await db.subscription.findMany({
      where: { userId },
      select: { id: true, senderEmail: true, messageCount: true },
    });
    const existingByEmail = new Map<string, { id: string; messageCount: number }>(existingSubs.map((s: { id: string; senderEmail: string; messageCount: number }) => [s.senderEmail, { id: s.id, messageCount: s.messageCount }]));

    logger.info(`Message processing complete in ${Date.now() - scanStart}ms. ${scannedEmails.size} unique senders, ${existingSubs.length} existing subscriptions`);

    const newEntries: { userId: string; senderEmail: string; senderName: string; listUnsubscribeHeader: string | undefined; unsubscribeMethod: string; unsubscribeUrl: string | undefined; unsubscribeMailto: string | undefined; confidenceScore: number; messageCount: number; recentSubject: string | undefined; recentSnippet: string | undefined; firstSeenAt: Date; lastSeenAt: Date }[] = [];
    const updatePayloads: { id: string; listUnsubscribeHeader: string | undefined; unsubscribeMethod: string; unsubscribeUrl: string | undefined; unsubscribeMailto: string | undefined; confidenceScore: number; messageCount: number; recentSubject: string | undefined; recentSnippet: string | undefined; lastSeenAt: Date }[] = [];
    const staleCount = existingSubs.filter((s: { id: string; senderEmail: string; messageCount: number }) => !scannedEmails.has(s.senderEmail)).length;

    for (const [senderEmail, count] of senderMessageCounts.entries()) {
      const data = senderData.get(senderEmail)!;
      const existing = existingByEmail.get(senderEmail);

      if (existing) {
        updatePayloads.push({
          id: existing.id,
          listUnsubscribeHeader: data.listUnsubscribeHeader,
          unsubscribeMethod: data.unsubscribeMethod,
          unsubscribeUrl: data.unsubscribeUrl,
          unsubscribeMailto: data.unsubscribeMailto,
          confidenceScore: data.confidenceScore,
          messageCount: existing.messageCount + count,
          recentSubject: data.recentSubject,
          recentSnippet: data.recentSnippet,
          lastSeenAt: new Date(),
        });
      } else {
        newEntries.push({
          userId,
          senderEmail,
          senderName: data.senderName,
          listUnsubscribeHeader: data.listUnsubscribeHeader,
          unsubscribeMethod: data.unsubscribeMethod,
          unsubscribeUrl: data.unsubscribeUrl,
          unsubscribeMailto: data.unsubscribeMailto,
          confidenceScore: data.confidenceScore,
          messageCount: count,
          recentSubject: data.recentSubject,
          recentSnippet: data.recentSnippet,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        });
      }
    }

    // Execute in a transaction
    await db.$transaction([
      // Batch create new subscriptions
      ...(newEntries.length > 0
        ? [db.subscription.createMany({ data: newEntries })]
        : []),
    ]);

    // Batch updates into transactional chunks (Prisma doesn't support bulk update with different values per row)
    const UPDATE_BATCH_SIZE = 50;
    for (let i = 0; i < updatePayloads.length; i += UPDATE_BATCH_SIZE) {
      const chunk = updatePayloads.slice(i, i + UPDATE_BATCH_SIZE);
      await db.$transaction(
        chunk.map(p => db.subscription.update({ where: { id: p.id }, data: p }))
      );
    }

    // Mark scan as complete
    logger.info(`DB writes complete in ${Date.now() - dbStart}ms: ${newEntries.length} created, ${updatePayloads.length} updated, ${staleCount} stale`);

    await db.gmailSyncState.update({
      where: { userId },
      data: {
        scanStatus: 'idle',
        lastSyncAt: new Date(),
      },
    });

    const totalMs = Date.now() - scanStart;
    logger.info(`Completed email scan for user ${userId} in ${totalMs}ms (${(totalMs/1000).toFixed(1)}s)`);
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
}

/**
 * Unsubscribe Job
 * Processes unsubscription requests
 */
export async function runUnsubscribe(data: UnsubscribeJobData) {
  const { userId, subscriptionId, accessToken, refreshToken } = data;

  // Clean up old unsubscription attempts (data retention: 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  await db.unsubscriptionAttempt.deleteMany({
    where: { attemptedAt: { lt: ninetyDaysAgo } },
  });

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
}

/**
 * Bulk Delete Job
 * Deletes all messages from a specific sender
 */
export async function runBulkDelete(data: BulkDeleteJobData) {
  const { userId, senderEmail } = data;

  // Dry-run mode: log what would happen without calling the Gmail API
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DRY RUN] Would delete emails from ${senderEmail} for user ${userId}`);
    logger.info(`[DRY RUN] Search patterns: from:${senderEmail}, from:${senderEmail.includes('@') ? senderEmail.split('@')[1] : senderEmail}`);
    return { success: true, deletedCount: 0, dryRun: true };
  }

  logger.info(`Starting bulk delete for ${senderEmail}`);

  // Record bulk deletion job
  const job = await db.bulkDeletionJob.create({
    data: {
      userId,
      senderEmail,
      status: 'pending',
      totalMessages: 0,
      deletedMessages: 0,
    },
  });

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
      await db.bulkDeletionJob.update({
        where: { id: job.id },
        data: {
          status: 'success',
          completedAt: new Date(),
        },
      });
      return { success: true, deletedCount: 0 };
    }

    logger.info(`Found ${messageIds.length} messages from ${senderEmail}, deleting...`);

    // Update total message count
    await db.bulkDeletionJob.update({
      where: { id: job.id },
      data: { totalMessages: messageIds.length },
    });

    // Create a single Gmail client for the entire delete job (avoids per-batch client churn)
    const gmailClient = await createGmailClient(accessToken, refreshToken, userId);

    // Delete messages in batches with retry on credential errors
    let deletedCount = 0;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await batchDeleteMessages(accessToken, refreshToken, messageIds, userId, gmailClient);
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
            // Create new client with fresh tokens for retry
            const freshClient = await createGmailClient(accessToken, refreshToken, userId);
            await batchDeleteMessages(accessToken, refreshToken, messageIds, userId, freshClient);
            deletedCount = messageIds.length;
            lastError = null;
            break; // Success, exit retry loop
          }
        }
        throw error;
      }
    }

    if (lastError) {
      throw lastError;
    }

    logger.info(`Deleted ${deletedCount} messages from ${senderEmail}`);

    // Mark job as completed
    await db.bulkDeletionJob.update({
      where: { id: job.id },
      data: {
        status: 'success',
        deletedMessages: deletedCount,
        completedAt: new Date(),
      },
    });

    return { success: true, deletedCount: messageIds.length };
  } catch (error) {
    logger.error(`Bulk delete failed for ${senderEmail}:`, error);
    // Mark job as failed
    await db.bulkDeletionJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    }).catch(() => {});
    throw error;
  }
}

/**
 * Rollup Job
 * Sends a digest email with all subscriptions
 */
export async function runRollup(data: RollupJobData) {
  const { userId } = data;

  logger.info(`Starting rollup digest for user ${userId}`);

  // Fetch fresh tokens from database for scheduled jobs
  const account = await db.account.findFirst({
    where: {
      userId,
      provider: 'google',
    },
  });

  if (!account || !account.access_token) {
    throw new Error('No valid Google account found');
  }

  const accessToken = account.access_token;
  const refreshToken = account.refresh_token ?? undefined;

  try {
    // Get subscriptions marked for rollup
    const subscriptions = await db.subscription.findMany({
      where: {
        userId,
        preferences: {
          some: {
            action: 'rollup',
          },
        },
      },
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
      ...subscriptions.map((sub: { senderName: string | null; senderEmail: string; unsubscribeUrl: string | null; unsubscribeMailto: string | null }, i: number) => {
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
}

/**
 * History Monitor Job
 * Polls Gmail history API to detect new messages and trigger email scans
 */
export async function runHistoryMonitor(data: HistoryMonitorJobData) {
  const { userId } = data;

  logger.info(`Starting history monitor for user ${userId}`);

  try {
    const account = await db.account.findFirst({
      where: {
        userId,
        provider: 'google',
      },
    });

    if (!account || !account.access_token) {
      logger.warn(`No valid Google account found for user ${userId}`);
      return { success: false, reason: 'no_account' };
    }

    const accessToken = account.access_token;
    const refreshToken = account.refresh_token ?? undefined;

    const syncState = await db.gmailSyncState.findUnique({
      where: { userId },
    });

    if (!syncState) {
      logger.info(`No sync state found for user ${userId}, fetching current history ID`);
      const currentHistoryId = await getCurrentHistoryId(accessToken, refreshToken, userId);

      await db.gmailSyncState.create({
        data: {
          userId,
          historyId: BigInt(currentHistoryId),
        },
      });

      logger.info(`Initialized history ID for user ${userId}: ${currentHistoryId}`);
      return { success: true, newMessages: 0, initialized: true };
    }

    const startHistoryId = syncState.historyId?.toString();

    if (!startHistoryId) {
      logger.info(`No history ID stored for user ${userId}, fetching current history ID`);
      const currentHistoryId = await getCurrentHistoryId(accessToken, refreshToken, userId);

      await db.gmailSyncState.update({
        where: { userId },
        data: { historyId: BigInt(currentHistoryId) },
      });

      return { success: true, newMessages: 0, initialized: true };
    }

    logger.info(`Fetching history for user ${userId} from historyId: ${startHistoryId}`);
    const newMessageIds = await listHistory(accessToken, refreshToken, startHistoryId, userId);

    if (newMessageIds.length === 0) {
      logger.info(`No new messages for user ${userId}`);
      return { success: true, newMessages: 0 };
    }

    logger.info(`Found ${newMessageIds.length} new messages for user ${userId}`);

    const currentHistoryId = await getCurrentHistoryId(accessToken, refreshToken, userId);

    await db.gmailSyncState.update({
      where: { userId },
      data: { historyId: BigInt(currentHistoryId) },
    });

    logger.info(`Updated history ID for user ${userId} from ${startHistoryId} to ${currentHistoryId}`);

    if (newMessageIds.length > 0) {
      const { getEmailScanQueue } = await import('./queues');
      await getEmailScanQueue().add(
        'email-scan',
        {
          userId,
          accessToken,
          refreshToken,
        },
        {
          jobId: `scan-${userId}-${Date.now()}`,
        }
      );
      logger.info(`Queued email scan for user ${userId} after detecting ${newMessageIds.length} new messages`);
    }

    return { success: true, newMessages: newMessageIds.length };
  } catch (error) {
    logger.error(`History monitor failed for user ${userId}:`, error);

    if (error instanceof InvalidTokenError) {
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
}
