# Template: Service Module

```ts
// src/lib/services/<domain>-service.ts
import type { Logger } from "@/lib/logger";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import type { WorkoutRepository } from "@/lib/repositories/workout-repository";

export interface WorkoutServiceDeps {
  repo: WorkoutRepository;
  logger: Logger;
  now?: () => Date;
}

export function createWorkoutService(deps: WorkoutServiceDeps) {
  const now = deps.now ?? (() => new Date());
  const log = deps.logger.child({ service: "workout" });

  return {
    async finish(userId: string, workoutId: string) {
      const w = await deps.repo.getById(workoutId);
      if (!w) throw new NotFoundError("Workout");
      if (w.userId !== userId) throw new ForbiddenError();
      const finishedAt = now();
      await deps.repo.markFinished(workoutId, finishedAt);
      log.info("workout.finished", { workoutId, userId });
      return { workoutId, finishedAt };
    },
  };
}

export type WorkoutService = ReturnType<typeof createWorkoutService>;
```

## Rules
- Pure — no direct Supabase imports, no `window`, no top-level `Date.now()`.
- Deps injected via a factory (`createXService(deps)`) for testability.
- Throws `AppError` subclasses; never `throw new Error(...)` for domain failures.
- Emits `logger.info` on success events, `logger.error` on caught exceptions before rethrow.
