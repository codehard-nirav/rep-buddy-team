/**
 * In-memory sliding-window rate limiter.
 *
 * IMPORTANT CAVEATS:
 * - The backend has no standard rate-limiting primitive (see engineering
 *   standards). This helper is a best-effort per-instance limiter.
 * - On serverless / edge deployments, each isolate has its own map, so
 *   effective limits are per-instance, not global. Treat this as spam
 *   deterrence, not a security control.
 * - For real abuse mitigation, front the endpoint with a WAF / gateway
 *   rate limit or move counters to Redis/Durable Objects.
 *
 * Usage (inside a server function handler, after auth):
 *   assertRateLimit(`comment:${userId}`, { limit: 10, windowMs: 60_000 });
 */
import { RateLimitError } from "./errors";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Max requests allowed in the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

export function checkRateLimit(
  key: string,
  opts: RateLimitOptions,
): { allowed: boolean; retryAfterMs: number; remaining: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, retryAfterMs: 0, remaining: opts.limit - 1 };
  }

  if (existing.count >= opts.limit) {
    return {
      allowed: false,
      retryAfterMs: existing.resetAt - now,
      remaining: 0,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    retryAfterMs: 0,
    remaining: opts.limit - existing.count,
  };
}

export function assertRateLimit(key: string, opts: RateLimitOptions): void {
  const result = checkRateLimit(key, opts);
  if (!result.allowed) {
    throw new RateLimitError("Too many requests. Please slow down.", {
      context: { retryAfterMs: result.retryAfterMs, key },
    });
  }
}

/** Test-only: clear all buckets. */
export function __resetRateLimits(): void {
  buckets.clear();
}
