import { RedisOptions } from 'ioredis';
import { logger } from '@/lib/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

function parseRedisUrl(url: string): RedisOptions {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 6379,
      password: parsed.password || undefined,
      db: parseInt(parsed.pathname.slice(1), 10) || 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  }
}

let connectionOptions: RedisOptions | null = null;

export function getRedisConnection(): RedisOptions {
  if (!connectionOptions) {
    connectionOptions = parseRedisUrl(redisUrl);
    logger.info(`Redis connection configured for ${connectionOptions.host}:${connectionOptions.port}`);
  }

  return connectionOptions;
}
