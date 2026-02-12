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
}

const inMemoryLimiter = new InMemoryRateLimiter();

/**
 * Get Redis connection for rate limiting
 */
function getRedisConnection(): Redis | null {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
    });
  }
  return null;
}

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

    await redis.quit();

    return {
      allowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - currentCount),
      resetAt,
    };
  } catch (error) {
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
