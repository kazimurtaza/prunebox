import { google } from 'googleapis';
import { logger } from '@/lib/logger';

/**
 * Custom error for invalid/revoked Google tokens
 */
export class InvalidTokenError extends Error {
  constructor(message: string = 'Google access token is invalid or has been revoked') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessagePart {
  mimeType?: string;
  filename?: string;
  headers?: GmailMessageHeader[];
  body?: {
    data?: string;
    size?: number;
  };
  parts?: GmailMessagePart[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  payload?: {
    headers?: GmailMessageHeader[];
    body?: {
      data?: string;
      size?: number;
    };
    parts?: GmailMessagePart[];
    mimeType?: string;
  };
  snippet?: string;
  internalDate?: string;
}

/**
 * Create an OAuth2 client with the user's access/refresh tokens
 * @param userId - User ID for token persistence (optional, for worker contexts)
 */
export function createOAuth2Client(
  accessToken: string,
  refreshToken?: string,
  userId?: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${appUrl}/api/auth/callback`
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Set up token refresh with database persistence
  oauth2Client.on('tokens', async (tokens) => {
    if (!userId) {
      // No userId provided, can't persist to database
      logger.warn('Token refreshed but no userId provided - skipping database persistence');
      if (tokens.refresh_token) {
        logger.info('New refresh token received (not persisted)');
      }
      if (tokens.access_token) {
        logger.debug('New access token received (not persisted)');
      }
      return;
    }

    try {
      // Import db dynamically to avoid circular dependencies in worker context
      const { db } = await import('@/lib/db');

      // Find the Google account for this user
      const account = await db.account.findFirst({
        where: {
          userId,
          provider: 'google',
        },
      });

      if (!account) {
        logger.warn(`No Google account found for userId ${userId} - cannot persist tokens`);
        return;
      }

      // Prepare update data
      const updateData: {
        access_token?: string;
        refresh_token?: string | null;
        expires_at?: number;
      } = {};

      if (tokens.access_token) {
        updateData.access_token = tokens.access_token;
        // Calculate expires_at (1 hour from now for Google tokens)
        updateData.expires_at = Math.floor(Date.now() / 1000) + 3600;
        logger.info(`Persisting new access token for user ${userId}`);
      }

      if (tokens.refresh_token) {
        updateData.refresh_token = tokens.refresh_token;
        logger.info(`Persisting new refresh token for user ${userId}`);
      }

      // Update the account with new tokens
      await db.account.update({
        where: { id: account.id },
        data: updateData,
      });

      logger.debug(`Successfully persisted tokens for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to persist refreshed tokens for user ${userId}:`, error);
    }
  });

  return oauth2Client;
}

/**
 * Create a Gmail API client for a user
 * @param userId - User ID for token persistence (optional, for worker contexts)
 */
export async function createGmailClient(
  accessToken: string,
  refreshToken?: string,
  userId?: string
) {
  const oauth2Client = createOAuth2Client(accessToken, refreshToken, userId);

  // Try to refresh if token is expired
  try {
    await oauth2Client.getAccessToken();
  } catch (error) {
    // Check for invalid_grant error - token expired/revoked
    const err = error as { code?: number; message?: string };
    if (err?.code === 401 ||
        err?.message?.includes('invalid_grant') ||
        err?.message?.includes('invalid_credentials') ||
        err?.message?.includes('Token has been expired') ||
        err?.message?.includes('access_token expired')) {
      logger.error(`Invalid Google token for user ${userId}: token has been revoked or expired`);
      throw new InvalidTokenError('Google access token is invalid or has been revoked. Please reconnect your account.');
    }
    logger.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh Gmail access token');
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * List messages matching a query with retry logic for rate limits
 * @param accessToken - User's access token
 * @param refreshToken - User's refresh token
 * @param query - Gmail search query
 * @param maxResults - Maximum total results to return (hard limit across all pages)
 * @param userId - User ID for token persistence (optional)
 * @returns Array of message IDs
 */
export async function listMessages(
  accessToken: string,
  refreshToken: string | undefined,
  query: string,
  maxResults?: number,
  userId?: string
): Promise<string[]> {
  const gmail = await createGmailClient(accessToken, refreshToken, userId);
  const messageIds: string[] = [];
  const unlimited = maxResults === undefined;
  const perPageLimit = unlimited ? 500 : Math.min(maxResults, 500); // Gmail API max per page is 500

  let pageToken: string | undefined;
  let retryCount = 0;
  const maxRetries = 3;

  let pageCount = 0;
  do {
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: perPageLimit,
        pageToken,
      });

      pageCount++;

      // Log the first page to see Gmail's estimate
      if (pageCount === 1) {
        logger.info(`Gmail API response for query "${query}":`, {
          resultSizeEstimate: response.data.resultSizeEstimate,
          messagesInFirstPage: response.data.messages?.length || 0,
          hasNextPage: !!response.data.nextPageToken,
        });
      }

      if (response.data.messages) {
        const pageMessages = response.data.messages.map((m) => m.id!);

        if (unlimited) {
          // Add all messages when unlimited mode
          messageIds.push(...pageMessages);
        } else {
          // Only add messages up to the maxResults limit
          const remaining = maxResults! - messageIds.length;
          if (remaining <= 0) {
            break; // We've reached the limit
          }
          messageIds.push(...pageMessages.slice(0, remaining));
        }
      }

      // Stop if we've reached our limit (not in unlimited mode)
      if (!unlimited && messageIds.length >= maxResults!) {
        break;
      }

      pageToken = response.data.nextPageToken || undefined;

      // Log when we finish (no more pages)
      if (!pageToken) {
        logger.info(`Gmail API: Finished fetching ${messageIds.length} messages across ${pageCount} pages`);
      }

      retryCount = 0; // Reset retry count on success
    } catch (error) {
      const err = error as { code?: number };
      // Handle rate limit errors (429) with exponential backoff
      if (err?.code === 429 && retryCount < maxRetries) {
        const delayMs = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        logger.warn(`Rate limit hit, retrying in ${delayMs}ms (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        retryCount++;
        continue; // Retry the same page
      }
      // If it's not a rate limit error or we've exhausted retries, throw
      throw error;
    }
  } while (pageToken);

  return messageIds;
}

/**
 * Get a message with full headers
 * @param gmailClient - Optional pre-created Gmail client to reuse (avoids per-message client churn)
 */
export async function getMessage(
  accessToken: string,
  refreshToken: string | undefined,
  messageId: string,
  format: 'minimal' | 'full' | 'raw' | 'metadata' = 'full',
  userId?: string,
  gmailClient?: Awaited<ReturnType<typeof createGmailClient>>
): Promise<GmailMessage | null> {
  const gmail = gmailClient || await createGmailClient(accessToken, refreshToken, userId);

  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format,
    });
    return response.data as GmailMessage;
  } catch (error) {
    logger.error(`Error fetching message ${messageId}:`, error);
    return null;
  }
}

/**
 * Get message headers as a key-value object
 */
export function getMessageHeaders(message: GmailMessage): Record<string, string> {
  const headers: Record<string, string> = {};

  if (message.payload?.headers) {
    for (const header of message.payload.headers) {
      headers[header.name] = header.value;
    }
  }

  return headers;
}

/**
 * Batch delete messages using Gmail batchDelete API
 * @param gmailClient - Optional pre-created Gmail client to reuse (avoids per-batch client churn)
 */
export async function batchDeleteMessages(
  accessToken: string,
  refreshToken: string | undefined,
  messageIds: string[],
  userId?: string,
  gmailClient?: Awaited<ReturnType<typeof createGmailClient>>
): Promise<void> {
  if (messageIds.length === 0) return;

  const gmail = gmailClient || await createGmailClient(accessToken, refreshToken, userId);

  const chunkSize = 1000;
  for (let i = 0; i < messageIds.length; i += chunkSize) {
    const chunk = messageIds.slice(i, i + chunkSize);

    await gmail.users.messages.batchDelete({
      userId: 'me',
      requestBody: { ids: chunk },
    });
  }
}

/**
 * Send an email (for rollup digest or unsubscribe mailto)
 */
export async function sendEmail(
  accessToken: string,
  refreshToken: string | undefined,
  to: string,
  subject: string,
  body: string
) {
  const gmail = await createGmailClient(accessToken, refreshToken);

  const safeTo = to.replace(/\r?\n/g, '');
  const safeSubject = subject.replace(/\r?\n/g, '');

  const message = [
    `To: ${safeTo}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${safeSubject}`,
    '',
    body,
  ].join('\r\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });

  return response.data;
}

/**
 * Fetch Gmail history list to detect new messages
 * @param startHistoryId - The history ID to start from (exclusive)
 * @returns Array of message IDs that were added
 */
export async function listHistory(
  accessToken: string,
  refreshToken: string | undefined,
  startHistoryId: string,
  userId?: string
): Promise<string[]> {
  const gmail = await createGmailClient(accessToken, refreshToken, userId);
  const messageIdSet = new Set<string>();

  let pageToken: string | undefined;
  let retryCount = 0;
  const maxRetries = 3;

  do {
    try {
      const response = await gmail.users.history.list({
        userId: 'me',
        startHistoryId,
        historyTypes: ['messageAdded'],
        pageToken,
      });

      if (response.data.history) {
        for (const historyRecord of response.data.history) {
          if (historyRecord.messagesAdded) {
            for (const msgAdded of historyRecord.messagesAdded) {
              if (msgAdded.message?.id) {
                messageIdSet.add(msgAdded.message.id);
              }
            }
          }
        }
      }

      pageToken = response.data.nextPageToken || undefined;
      retryCount = 0;
    } catch (error) {
      const err = error as { code?: number };
      if (err?.code === 429 && retryCount < maxRetries) {
        const delayMs = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        logger.warn(`History API rate limit hit, retrying in ${delayMs}ms (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        retryCount++;
        continue;
      }
      if (err?.code === 404) {
        logger.info(`History ID ${startHistoryId} is too old, performing full sync`);
        return [];
      }
      throw error;
    }
  } while (pageToken);

  return Array.from(messageIdSet);
}

/**
 * Get the current history ID for a user's Gmail account
 */
export async function getCurrentHistoryId(
  accessToken: string,
  refreshToken: string | undefined,
  userId?: string
): Promise<string> {
  const gmail = await createGmailClient(accessToken, refreshToken, userId);

  const profile = await gmail.users.getProfile({
    userId: 'me',
  });

  if (!profile.data.historyId) {
    throw new Error('No history ID in Gmail profile');
  }

  return profile.data.historyId;
}
