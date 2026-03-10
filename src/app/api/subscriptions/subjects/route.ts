import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { ApiErrorResponse, withErrorHandling } from '@/lib/errors';
import { listMessages, getMessage } from '@/modules/gmail/client';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const session = await auth();

    if (!session?.user) {
      return ApiErrorResponse.unauthorized();
    }

    if (!session.accessToken) {
      return ApiErrorResponse.badRequest('No Gmail access token');
    }

    const { searchParams } = new URL(request.url);
    const senderEmail = searchParams.get('senderEmail');

    if (!senderEmail) {
      return ApiErrorResponse.badRequest('senderEmail is required');
    }

    logger.info(`Fetching subjects for sender: ${senderEmail}`);

    // Build Gmail search query for this sender (exclude spam/trash)
    // Gmail search doesn't support wildcards in from field, use exact email
    const query = `from:${senderEmail} -in:spam -in:trash`;

    logger.debug(`Search query: ${query}`);

    // Get message IDs (limit to 15 most recent for performance)
    const messageIds = await listMessages(
      session.accessToken,
      session.refreshToken,
      query,
      15,
      session.user.id
    );

    logger.info(`Found ${messageIds.length} messages for ${senderEmail}`);

    // Fetch subjects for each message
    const subjects: string[] = [];
    for (const messageId of messageIds) {
      const message = await getMessage(
        session.accessToken,
        session.refreshToken,
        messageId,
        'metadata', // Use 'metadata' to get headers (lighter than 'full')
        session.user.id,
      );

      if (message?.payload?.headers) {
        const subjectHeader = message.payload.headers.find(h => h.name === 'Subject');
        if (subjectHeader?.value) {
          subjects.push(subjectHeader.value);
        }
      }
    }

    logger.info(`Returning ${subjects.length} subjects for ${senderEmail}`);
    return NextResponse.json({ subjects });
  }, 'Failed to fetch email subjects');
}
