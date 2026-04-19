import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redisConnection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redisConnection) {
    redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisConnection.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisConnection.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }

  return redisConnection;
}
