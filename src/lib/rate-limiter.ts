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
 * Simple in-memory rate limiter
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
 * Check rate limit using in-memory store
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return inMemoryLimiter.check(identifier, config);
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
