import { NextResponse } from 'next/server';
import { queueEmailScan } from '@/modules/queues';

// Gmail Push Notification webhook endpoint
// This receives notifications when new emails arrive
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message?.data) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    // Decode the base64 data
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const data = JSON.parse(decodedData);

    const { emailAddress, historyId } = data;

    if (!emailAddress || !historyId) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
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
  } catch (error) {
    console.error('Error processing Gmail webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
