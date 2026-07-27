/**
 * Unit tests for the in-memory sliding-window rate limiter.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, assertRateLimit, __resetRateLimits } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

const opts = { limit: 3, windowMs: 60_000 };

describe("rate limiter", () => {
  beforeEach(() => {
    __resetRateLimits();
  });

  it("allows requests under the limit", () => {
    const r1 = checkRateLimit("usr_1:signup", opts);
    const r2 = checkRateLimit("usr_1:signup", opts);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it("blocks once the limit is exceeded", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("usr_2:signup", opts);
    const blocked = checkRateLimit("usr_2:signup", opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("assertRateLimit throws RateLimitError when blocked", () => {
    const tight = { limit: 2, windowMs: 60_000 };
    assertRateLimit("usr_3:x", tight);
    assertRateLimit("usr_3:x", tight);
    expect(() => assertRateLimit("usr_3:x", tight)).toThrowError(RateLimitError);
  });

  it("isolates keys", () => {
    const tight = { limit: 2, windowMs: 60_000 };
    checkRateLimit("a", tight);
    checkRateLimit("a", tight);
    expect(checkRateLimit("b", tight).allowed).toBe(true);
  });
});
