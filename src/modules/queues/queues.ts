import { Queue } from 'bullmq';
import { redisConnection } from './config';

export const emailScanQueue = new Queue('email-scan', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
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
  },
});

export const unsubscribeQueue = new Queue('unsubscribe', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
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
  },
});

export const bulkDeleteQueue = new Queue('bulk-delete', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
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
  },
});

export const rollupQueue = new Queue('rollup-digest', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
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
  },
});

export async function scheduleDailyRollup(userId: string, accessToken: string, refreshToken?: string) {
  const jobId = `daily-digest-${userId}`;
  await rollupQueue.add(
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
  const job = await rollupQueue.getJob(jobId);
  if (job) {
    await job.remove();
  }
}
