import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.send',
];

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  payload?: {
    headers?: GmailMessageHeader[];
    body?: {
      data?: string;
    };
  };
  snippet?: string;
  internalDate?: string;
}

/**
 * Create an OAuth2 client with the user's access/refresh tokens
 */
export function createOAuth2Client(accessToken: string, refreshToken?: string): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Set up token refresh
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // Store new refresh token if provided
      console.log('New refresh token received');
    }
    if (tokens.access_token) {
      console.log('New access token received');
    }
  });

  return oauth2Client;
}

/**
 * Create a Gmail API client for a user
 */
export async function createGmailClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = createOAuth2Client(accessToken, refreshToken);

  // Try to refresh if token is expired
  try {
    await oauth2Client.getAccessToken();
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh Gmail access token');
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * List messages matching a query
 */
export async function listMessages(
  accessToken: string,
  refreshToken: string | undefined,
  query: string,
  maxResults = 2000
): Promise<string[]> {
  const gmail = await createGmailClient(accessToken, refreshToken);
  const messageIds: string[] = [];

  let pageToken: string | undefined;
  do {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
      pageToken,
    });

    if (response.data.messages) {
      messageIds.push(...response.data.messages.map((m) => m.id!));
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return messageIds;
}

/**
 * Get a message with full headers
 */
export async function getMessage(
  accessToken: string,
  refreshToken: string | undefined,
  messageId: string,
  format: 'minimal' | 'full' | 'raw' = 'full'
): Promise<GmailMessage | null> {
  const gmail = await createGmailClient(accessToken, refreshToken);

  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format,
    });
    return response.data as GmailMessage;
  } catch (error) {
    console.error(`Error fetching message ${messageId}:`, error);
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
 * Batch delete messages
 */
export async function batchDeleteMessages(
  accessToken: string,
  refreshToken: string | undefined,
  messageIds: string[]
): Promise<void> {
  if (messageIds.length === 0) return;

  const gmail = await createGmailClient(accessToken, refreshToken);

  // Batch delete in chunks of 1000
  for (let i = 0; i < messageIds.length; i += 1000) {
    const chunk = messageIds.slice(i, i + 1000);
    await gmail.users.messages.batchDelete({
      userId: 'me',
      requestBody: { ids: chunk },
    });
  }
}

/**
 * Get history for incremental sync
 */
export async function getHistory(
  accessToken: string,
  refreshToken: string | undefined,
  startHistoryId?: string
) {
  const gmail = await createGmailClient(accessToken, refreshToken);

  const response = await gmail.users.history.list({
    userId: 'me',
    startHistoryId,
  });

  return response.data;
}

/**
 * Watch for mailbox changes (Push Notifications)
 */
export async function watchMailbox(
  accessToken: string,
  refreshToken: string | undefined,
  topicName: string
) {
  const gmail = await createGmailClient(accessToken, refreshToken);

  const response = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName,
      labelIds: ['INBOX'],
    },
  });

  return response.data;
}

/**
 * Stop watching mailbox
 */
export async function stopWatching(accessToken: string, refreshToken: string | undefined) {
  const gmail = await createGmailClient(accessToken, refreshToken);

  await gmail.users.stop({
    userId: 'me',
  });
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

  const message = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
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

export { GMAIL_SCOPES };
