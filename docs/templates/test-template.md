# Template: Unit Test

```ts
// src/lib/services/workout-service.test.ts
import { describe, it, expect, vi } from "vitest";
import { createWorkoutService } from "./workout-service";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

const silentLogger = {
  debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  child() { return this; },
};

function makeRepo(overrides: Partial<any> = {}) {
  return {
    getById: vi.fn().mockResolvedValue({ id: "w1", userId: "u1" }),
    markFinished: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("workout-service.finish", () => {
  it("marks the workout finished when the owner calls", async () => {
    const repo = makeRepo();
    const now = () => new Date("2026-01-01T00:00:00Z");
    const svc = createWorkoutService({ repo: repo as any, logger: silentLogger as any, now });

    const res = await svc.finish("u1", "w1");
    expect(res.workoutId).toBe("w1");
    expect(repo.markFinished).toHaveBeenCalledWith("w1", now());
  });

  it("throws NotFoundError when the workout is missing", async () => {
    const repo = makeRepo({ getById: vi.fn().mockResolvedValue(null) });
    const svc = createWorkoutService({ repo: repo as any, logger: silentLogger as any });
    await expect(svc.finish("u1", "missing")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when a non-owner calls", async () => {
    const svc = createWorkoutService({ repo: makeRepo() as any, logger: silentLogger as any });
    await expect(svc.finish("intruder", "w1")).rejects.toBeInstanceOf(ForbiddenError);
  });
});
```

## Rules
- `describe(<subject>)` + `it("<does X> when <Y>")`.
- One assertion per behavior; multiple `expect` calls per assertion are fine.
- Use `vi.fn()` fakes, not real Supabase.
- Fixed clocks via injected `now`.
