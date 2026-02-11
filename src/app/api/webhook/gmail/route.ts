import { NextResponse } from 'next/server';
import { queueEmailScan } from '@/modules/queues';
import { ApiErrorResponse, withErrorHandling } from '@/lib/errors';

// Gmail Push Notification webhook endpoint
// This receives notifications when new emails arrive
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const { message } = body;

    if (!message?.data) {
      return ApiErrorResponse.badRequest('Invalid message format');
    }

    // Decode the base64 data
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const data = JSON.parse(decodedData);

    const { emailAddress, historyId } = data;

    if (!emailAddress || !historyId) {
      return ApiErrorResponse.badRequest('Invalid data: missing emailAddress or historyId');
    }

    // Find user by Gmail address
    // In production, you'd map email addresses to user IDs
    // For now, this is a placeholder

    // Queue a scan for this user
    // await queueEmailScan({ userId, ... });

    // Acknowledge the message
    await fetch(message.acknowledgeUrl || '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ack: true }),
    });

    return NextResponse.json({ success: true });
  }, 'Failed to process Gmail webhook');
}
