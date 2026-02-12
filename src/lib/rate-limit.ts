import Redis from 'ioredis';
import { ApiErrorResponse } from '@/lib/errors';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests allowed in the window
}

interface RateLimitResult {
  success: boolean;
  remainingRequests: number;
  resetTime: Date;
}

/**
 * Simple rate limiter using Redis
 * Limits requests per user per time window
 */
export class RateLimiter {
  private redis: Redis;
  private prefix: string;
  private config: RateLimitConfig;

  constructor(redis: Redis, keyPrefix: string, config: RateLimitConfig) {
    this.redis = redis;
    this.prefix = keyPrefix;
    this.config = config;
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (e.g., userId)
   * @returns RateLimitResult with success status and metadata
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Use a Redis sorted set to track request timestamps
    const pipeline = this.redis.pipeline();

    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current requests in window
    pipeline.zcard(key);

    // Add current request timestamp
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiration to clean up old keys
    pipeline.expire(key, Math.ceil(this.config.windowMs / 1000) + 1);

    const results = await pipeline.exec();

    if (!results || results[1][1] === undefined) {
      // Redis error, allow request as fallback
      return {
        success: true,
        remainingRequests: this.config.maxRequests,
        resetTime: new Date(now + this.config.windowMs),
      };
    }

    const currentRequestCount = results[1][1] as number;
    const remainingRequests = Math.max(0, this.config.maxRequests - currentRequestCount);

    return {
      success: currentRequestCount <= this.config.maxRequests,
      remainingRequests,
      resetTime: new Date(now + this.config.windowMs),
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `${this.prefix}:${identifier}`;
    await this.redis.del(key);
  }
}

/**
 * Rate limit configuration for scan endpoint
 * Limits: 1 scan per 5 minutes per user
 */
export const SCAN_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000,  // 5 minutes
  maxRequests: 1,
};

/**
 * Create a rate limiter for the scan endpoint
 */
export function createScanRateLimiter(redis: Redis): RateLimiter {
  return new RateLimiter(redis, 'ratelimit:scan', SCAN_RATE_LIMIT);
}

/**
 * Middleware helper to check rate limit and return error if exceeded
 */
export async function checkScanRateLimit(
  redis: Redis,
  userId: string
): Promise<RateLimitResult | { response: ReturnType<typeof ApiErrorResponse.tooManyRequests> }> {
  const limiter = createScanRateLimiter(redis);
  const result = await limiter.check(userId);

  if (!result.success) {
    return {
      response: ApiErrorResponse.tooManyRequests(
        `Too many scan requests. Please wait ${Math.ceil((result.resetTime.getTime() - Date.now()) / 60000)} minutes before trying again.`
      ),
    };
  }

  return result;
}
