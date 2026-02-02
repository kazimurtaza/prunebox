import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Queue names
export const QUEUE_NAMES = {
  EMAIL_SCAN: 'email-scan',
  UNSUBSCRIBE: 'unsubscribe',
  ROLLUP: 'rollup-digest',
  BULK_DELETE: 'bulk-delete',
  TOKEN_REFRESH: 'token-refresh',
} as const;

// Redis connection - lazy initialization
let connection: Redis | null = null;

function getConnection() {
  if (!connection && process.env.REDIS_URL) {
    connection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

// Create queues - lazy initialization
let emailScanQueueInstance: Queue | null = null;
let unsubscribeQueueInstance: Queue | null = null;
let rollupQueueInstance: Queue | null = null;
let bulkDeleteQueueInstance: Queue | null = null;

export function getQueues() {
  const conn = getConnection();
  if (!conn) {
    throw new Error('Redis connection not available. Set REDIS_URL environment variable.');
  }

  if (!emailScanQueueInstance) {
    emailScanQueueInstance = new Queue(QUEUE_NAMES.EMAIL_SCAN, { connection: conn });
  }
  if (!unsubscribeQueueInstance) {
    unsubscribeQueueInstance = new Queue(QUEUE_NAMES.UNSUBSCRIBE, { connection: conn });
  }
  if (!rollupQueueInstance) {
    rollupQueueInstance = new Queue(QUEUE_NAMES.ROLLUP, { connection: conn });
  }
  if (!bulkDeleteQueueInstance) {
    bulkDeleteQueueInstance = new Queue(QUEUE_NAMES.BULK_DELETE, { connection: conn });
  }

  return {
    emailScanQueue: emailScanQueueInstance,
    unsubscribeQueue: unsubscribeQueueInstance,
    rollupQueue: rollupQueueInstance,
    bulkDeleteQueue: bulkDeleteQueueInstance,
  };
}

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

// Add job helper functions
export async function queueEmailScan(data: EmailScanJobData, options?: { delay?: number }) {
  const { emailScanQueue } = getQueues();
  return emailScanQueue.add('scan', data, {
    jobId: `scan-${data.userId}-${Date.now()}`,
    ...options,
  });
}

export async function queueUnsubscribe(data: UnsubscribeJobData) {
  const { unsubscribeQueue } = getQueues();
  return unsubscribeQueue.add('unsubscribe', data, {
    jobId: `unsub-${data.subscriptionId}`,
  });
}

export async function queueRollup(data: RollupJobData, cronPattern?: string) {
  const { rollupQueue } = getQueues();
  return rollupQueue.add('rollup', data, {
    jobId: `rollup-${data.userId}`,
    repeat: cronPattern ? { pattern: cronPattern } : undefined,
  });
}

export async function queueBulkDelete(data: BulkDeleteJobData) {
  const { bulkDeleteQueue } = getQueues();
  return bulkDeleteQueue.add('delete', data, {
    jobId: `delete-${data.userId}-${Date.now()}`,
  });
}

// Get queue status
export async function getQueueStats() {
  const { emailScanQueue, unsubscribeQueue, rollupQueue, bulkDeleteQueue } = getQueues();

  const [scan, unsub, rollup, deleteQ] = await Promise.all([
    emailScanQueue.getJobCounts(),
    unsubscribeQueue.getJobCounts(),
    rollupQueue.getJobCounts(),
    bulkDeleteQueue.getJobCounts(),
  ]);

  return {
    emailScan: scan,
    unsubscribe: unsub,
    rollup: rollup,
    bulkDelete: deleteQ,
  };
}

export { getConnection };
