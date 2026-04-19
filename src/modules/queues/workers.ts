import { Worker } from 'bullmq';
import { redisConnection } from './config';
import { runEmailScan, runUnsubscribe, runBulkDelete, runRollup } from './jobs';
import { logger } from '@/lib/logger';

let workers: Worker[] | null = null;

export function initializeWorkers() {
  if (workers) {
    logger.info('Workers already initialized');
    return workers;
  }

  const emailScanWorker = new Worker(
    'email-scan',
    async (job) => {
      return await runEmailScan(job.data);
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  const unsubscribeWorker = new Worker(
    'unsubscribe',
    async (job) => {
      return await runUnsubscribe(job.data);
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );

  const bulkDeleteWorker = new Worker(
    'bulk-delete',
    async (job) => {
      return await runBulkDelete(job.data);
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );

  const rollupWorker = new Worker(
    'rollup-digest',
    async (job) => {
      return await runRollup(job.data);
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  workers = [emailScanWorker, unsubscribeWorker, bulkDeleteWorker, rollupWorker];

  workers.forEach((worker) => {
    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed in queue ${job.queueName}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed in queue ${job?.queueName}:`, err);
    });

    worker.on('error', (err) => {
      logger.error('Worker error:', err);
    });
  });

  logger.info('BullMQ workers initialized');
  return workers;
}

export async function closeWorkers() {
  if (workers) {
    await Promise.all(workers.map((worker) => worker.close()));
    workers = null;
    logger.info('BullMQ workers closed');
  }
}

initializeWorkers();
