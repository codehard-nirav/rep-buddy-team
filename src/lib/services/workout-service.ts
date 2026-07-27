/**
 * Workout service — business logic. Pure, dependency-injected, testable.
 *
 * Never imports Supabase directly. Never touches `window` / `document`.
 * Consumes a repository interface + a logger + a clock.
 */
import { ForbiddenError } from "@/lib/errors";
import type { Logger } from "@/lib/logger";
import type { WorkoutRepository, WorkoutDTO } from "@/lib/repositories/workout-repository";

export interface WorkoutServiceDeps {
  repo: WorkoutRepository;
  logger: Logger;
  /** Injectable clock — override in tests. */
  now?: () => Date;
}

export interface FinishWorkoutInput {
  actorUserId: string;
  workoutId: string;
  totalVolume: number;
}

export interface FinishWorkoutResult {
  workoutId: string;
  finishedAt: Date;
  durationSeconds: number;
}

export function createWorkoutService(deps: WorkoutServiceDeps) {
  const now = deps.now ?? (() => new Date());
  const log = deps.logger.child({ service: "workout" });

  return {
    async finish(input: FinishWorkoutInput): Promise<FinishWorkoutResult> {
      const workout = await deps.repo.getByIdOrThrow(input.workoutId);

      if (workout.userId !== input.actorUserId) {
        log.warn("workout.finish.forbidden", {
          workoutId: workout.id,
          actor: input.actorUserId,
        });
        throw new ForbiddenError("You can only finish your own workouts.");
      }

      const finishedAt = now();
      const durationSeconds = Math.max(
        0,
        Math.floor((finishedAt.getTime() - workout.startedAt.getTime()) / 1000),
      );

      await deps.repo.markFinished(workout.id, finishedAt, {
        durationSeconds,
        totalVolume: input.totalVolume,
      });

      log.info("workout.finished", {
        workoutId: workout.id,
        durationSeconds,
        totalVolume: input.totalVolume,
      });

      return { workoutId: workout.id, finishedAt, durationSeconds };
    },

    async getVisible(
      actorUserId: string,
      workoutId: string,
    ): Promise<WorkoutDTO> {
      // RLS already scopes SELECT to owner / coach / public. If the row
      // comes back, the caller is allowed to see it.
      return deps.repo.getByIdOrThrow(workoutId);
    },
  };
}

export type WorkoutService = ReturnType<typeof createWorkoutService>;
