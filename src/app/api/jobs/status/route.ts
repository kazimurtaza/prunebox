import { NextRequest, NextResponse } from 'next/server';
import { getQueues } from '@/modules/queues/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('id');

  if (!jobId) {
    return NextResponse.json({ error: 'Missing job ID' }, { status: 400 });
  }

  try {
    const { bulkDeleteQueue, unsubscribeQueue, emailScanQueue, rollupQueue } = getQueues();

    // Try to find the job in each queue
    const queues = [bulkDeleteQueue, unsubscribeQueue, emailScanQueue, rollupQueue];

    for (const queue of queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        const state = await job.getState();
        return NextResponse.json({
          id: jobId,
          status: state,
          progress: job.progress,
          failedReason: job.failedReason,
        });
      }
    }

    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json({ error: 'Failed to fetch job status' }, { status: 500 });
  }
}
