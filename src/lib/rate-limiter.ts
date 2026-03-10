import Redis from 'ioredis';
import { ApiErrorResponse, HttpStatus } from './errors';
import { logger } from './logger';

// Rate limit configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Rate limit result
interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt?: Date;
}

// Default configurations for different endpoints
export const RATE_LIMITS = {
  SCAN: { maxRequests: 1, windowMs: 60 * 1000 }, // 1 scan per minute
  BULK_ACTION: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 bulk actions per minute
  WEBHOOK: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 webhooks per minute
} as const;

// Redis key prefix
const KEY_PREFIX = 'rate_limit:';

/**
 * Simple in-memory rate limiter fallback when Redis is not available
 */
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  check(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const key = `${KEY_PREFIX}${identifier}`;

    // Get existing requests for this identifier
    let timestamps = this.requests.get(key) || [];

    // Filter out timestamps outside the window
    timestamps = timestamps.filter((ts) => ts > now - config.windowMs);

    // Check if limit exceeded
    const allowed = timestamps.length < config.maxRequests;

    // Add current timestamp if allowed
    if (allowed) {
      timestamps.push(now);
    }

    // Store updated timestamps
    this.requests.set(key, timestamps);

    // Calculate when the oldest request will expire
    const oldestTimestamp = timestamps[0];
    const resetAt = oldestTimestamp
      ? new Date(oldestTimestamp + config.windowMs)
      : undefined;

    return {
      allowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - timestamps.length),
      resetAt,
    };
  }

  reset(identifier: string): void {
    this.requests.delete(`${KEY_PREFIX}${identifier}`);
  }

  clear(): void {
    this.requests.clear();
  }

  /**
   * Cleanup old entries where the latest timestamp is older than any window
   * This prevents memory leaks from users who stop making requests
   */
  private cleanup(): void {
    const now = Date.now();
    let deleted = 0;

    // Use the maximum window size from all rate limit configs
    const maxWindowMs = Math.max(
      ...Object.values(RATE_LIMITS).map((config) => config.windowMs)
    );

    for (const [key, timestamps] of this.requests.entries()) {
      // Find the latest timestamp for this key
      const latestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;

      // If the latest timestamp is older than the max window, delete the entry
      if (latestTimestamp < now - maxWindowMs) {
        this.requests.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      logger.debug(`Rate limiter cleanup: removed ${deleted} stale entries`);
    }
  }

  /**
   * Stop the cleanup interval (call on app shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

const inMemoryLimiter = new InMemoryRateLimiter();

// Cleanup on process exit
process.on('beforeExit', () => {
  inMemoryLimiter.destroy();
});

/**
 * Singleton Redis client for rate limiting
 * Reused across all requests to avoid connection overhead
 */
let redisClient: Redis | null = null;
let redisConnectionFailed = false;
let reconnectTimeout: NodeJS.Timeout | null = null;

/**
 * Get or create the singleton Redis connection
 */
function getRedisConnection(): Redis | null {
  // Return null if Redis is not configured
  if (!process.env.REDIS_URL) {
    return null;
  }

  // Return null if connection previously failed (will be reset after delay)
  if (redisConnectionFailed) {
    return null;
  }

  // Return existing client if already initialized and ready
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  // Clear any pending reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Create new singleton client
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null; // Don't retry after 3 attempts
        return Math.min(times * 100, 3000);
      },
      reconnectOnError: (err) => {
        // Reconnect on READONLY errors, but not on auth errors
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        // Don't reconnect on authentication errors or NOAUTH
        if (err.message.includes('NOAUTH') || err.message.includes('WRONGPASS')) {
          return false;
        }
        return false;
      },
      // Enable ready check to ensure connection is actually ready
      enableReadyCheck: true,
    });

    // Handle connection events
    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
      // Don't mark as failed - allow reconnection attempts via ioredis
    });

    redisClient.on('connect', () => {
      logger.debug('Redis client connected for rate limiting');
    });

    redisClient.on('ready', () => {
      logger.debug('Redis client ready for rate limiting');
      redisConnectionFailed = false;
    });

    redisClient.on('close', () => {
      logger.debug('Redis client connection closed');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to create Redis client, falling back to in-memory:', error);
    redisConnectionFailed = true;
    // Schedule reconnection attempt after delay (without setTimeout loop)
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(() => {
        redisConnectionFailed = false;
        reconnectTimeout = null;
        // Client will be recreated on next getRedisConnection call
      }, 5000);
    }
    return null;
  }
}

/**
 * Close the Redis connection (call on app shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.debug('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    } finally {
      redisClient = null;
    }
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await closeRedisConnection();
});

process.on('SIGINT', async () => {
  await closeRedisConnection();
});

process.on('SIGTERM', async () => {
  await closeRedisConnection();
});

/**
 * Check rate limit using Redis or in-memory fallback
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisConnection();

  if (!redis) {
    // Fallback to in-memory rate limiting
    return inMemoryLimiter.check(identifier, config);
  }

  try {
    const key = `${KEY_PREFIX}${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Use Redis sorted set for time-series data
    const pipeline = redis.pipeline();

    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    pipeline.zcard(key);

    // Add current request if allowed
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiry on the key
    pipeline.expire(key, Math.ceil(config.windowMs / 1000) + 1);

    const results = await pipeline.exec();

    if (!results || results.length < 4) {
      throw new Error('Redis pipeline failed');
    }

    const countResult = results[1];
    const currentCount = (countResult[1] as number) || 0;

    const allowed = currentCount < config.maxRequests;

    // If not allowed, remove the request we just added
    if (!allowed) {
      await redis.zremrangebyrank(key, 0, 0);
    }

    // Get the oldest timestamp to calculate reset time
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
    let resetAt: Date | undefined;
    if (oldest && oldest.length > 1) {
      const score = oldest[1] as unknown;
      if (typeof score === 'number') {
        resetAt = new Date(Number(score) + config.windowMs);
      }
    }

    return {
      allowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - currentCount),
      resetAt,
    };
  } catch (error) {
    // Only mark Redis as failed for connection-level errors (not transient errors)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isConnectionError =
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('CONNECTION_BROKEN');

    if (isConnectionError && !redisConnectionFailed) {
      redisConnectionFailed = true;
      // Schedule reconnection attempt after delay (only once)
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          redisConnectionFailed = false;
          reconnectTimeout = null;
          // Close the old client so it gets recreated
          if (redisClient) {
            redisClient.quit().catch(() => {
              // Ignore errors during cleanup
            });
            redisClient = null;
          }
        }, 5000);
      }
    }

    logger.error('Rate limiter Redis error, falling back to in-memory:', error);
    return inMemoryLimiter.check(identifier, config);
  }
}

/**
 * Rate limit middleware for API routes
 * Returns a response if rate limited, null if allowed
 */
export async function withRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<ReturnType<typeof ApiErrorResponse.tooManyRequests> | null> {
  const result = await checkRateLimit(identifier, config);

  if (!result.allowed) {
    const retryAfterSeconds = result.resetAt
      ? Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
      : 60;

    return ApiErrorResponse.tooManyRequests(
      `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`
    );
  }

  return null;
}

/**
 * Create a rate limit response with headers
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
  };

  if (result.resetAt) {
    headers['Retry-After'] = Math.ceil(
      (result.resetAt.getTime() - Date.now()) / 1000
    ).toString();
    headers['X-RateLimit-Reset'] = result.resetAt.toISOString();
  }

  return new Response(
    JSON.stringify({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
        status: HttpStatus.TOO_MANY_REQUESTS,
      },
    }),
    {
      status: HttpStatus.TOO_MANY_REQUESTS,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}
