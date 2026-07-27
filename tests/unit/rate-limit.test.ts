/**
 * Unit tests for the in-memory sliding-window rate limiter.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, assertRateLimit, __resetRateLimitStore } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

describe("rate limiter", () => {
  beforeEach(() => {
    __resetRateLimitStore?.();
  });

  it("allows requests under the limit", () => {
    const r1 = checkRateLimit({ key: "usr_1:signup", limit: 3, windowMs: 60_000 });
    const r2 = checkRateLimit({ key: "usr_1:signup", limit: 3, windowMs: 60_000 });
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it("blocks once the limit is exceeded", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit({ key: "usr_2:signup", limit: 3, windowMs: 60_000 });
    }
    const blocked = checkRateLimit({ key: "usr_2:signup", limit: 3, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
  });

  it("assertRateLimit throws RateLimitError when blocked", () => {
    for (let i = 0; i < 2; i++) {
      assertRateLimit({ key: "usr_3:x", limit: 2, windowMs: 60_000 });
    }
    expect(() =>
      assertRateLimit({ key: "usr_3:x", limit: 2, windowMs: 60_000 }),
    ).toThrowError(RateLimitError);
  });

  it("isolates keys", () => {
    for (let i = 0; i < 2; i++) {
      checkRateLimit({ key: "a", limit: 2, windowMs: 60_000 });
    }
    expect(checkRateLimit({ key: "b", limit: 2, windowMs: 60_000 }).allowed).toBe(true);
  });
});
