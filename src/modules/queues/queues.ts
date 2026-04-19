import { Queue } from 'bullmq';
import { getRedisConnection } from './config';

// Queue instances are lazy-loaded to avoid creating them during Next.js build
// This prevents Redis connection attempts during build time

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
  removeOnComplete: {
    age: 24 * 3600,
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 3600,
    count: 5000,
  },
};

let emailScanQueueInstance: Queue | null = null;
let unsubscribeQueueInstance: Queue | null = null;
let bulkDeleteQueueInstance: Queue | null = null;
let rollupQueueInstance: Queue | null = null;

export function getEmailScanQueue(): Queue {
  if (!emailScanQueueInstance) {
    emailScanQueueInstance = new Queue('email-scan', {
      connection: getRedisConnection(),
      defaultJobOptions,
    });
  }
  return emailScanQueueInstance;
}

export function getUnsubscribeQueue(): Queue {
  if (!unsubscribeQueueInstance) {
    unsubscribeQueueInstance = new Queue('unsubscribe', {
      connection: getRedisConnection(),
      defaultJobOptions,
    });
  }
  return unsubscribeQueueInstance;
}

export function getBulkDeleteQueue(): Queue {
  if (!bulkDeleteQueueInstance) {
    bulkDeleteQueueInstance = new Queue('bulk-delete', {
      connection: getRedisConnection(),
      defaultJobOptions,
    });
  }
  return bulkDeleteQueueInstance;
}

export function getRollupQueue(): Queue {
  if (!rollupQueueInstance) {
    rollupQueueInstance = new Queue('rollup-digest', {
      connection: getRedisConnection(),
      defaultJobOptions,
    });
  }
  return rollupQueueInstance;
}

export async function scheduleDailyRollup(userId: string, accessToken: string, refreshToken?: string) {
  const jobId = `daily-digest-${userId}`;
  await getRollupQueue().add(
    'daily-digest',
    {
      userId,
      accessToken,
      refreshToken,
    },
    {
      jobId,
      repeat: {
        pattern: '0 8 * * *',
      },
    }
  );
}

export async function removeScheduledRollup(userId: string) {
  const jobId = `daily-digest-${userId}`;
  const job = await getRollupQueue().getJob(jobId);
  if (job) {
    await job.remove();
  }
}
