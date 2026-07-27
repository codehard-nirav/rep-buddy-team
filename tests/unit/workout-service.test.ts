/**
 * Unit tests for the workout service — pure logic with injected repo, logger,
 * and clock. No Supabase, no network.
 */
import { describe, it, expect, vi } from "vitest";
import { createWorkoutService } from "@/lib/services/workout-service";
import type { WorkoutRepository, WorkoutDTO } from "@/lib/repositories/workout-repository";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

const silentLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  child() {
    return silentLogger;
  },
} as const;

function makeWorkout(overrides: Partial<WorkoutDTO> = {}): WorkoutDTO {
  return {
    id: "wk_1",
    userId: "usr_owner",
    routineId: null,
    name: null,
    notes: null,
    startedAt: new Date("2026-07-27T12:00:00Z"),
    finishedAt: null,
    durationSeconds: null,
    totalVolume: 0,
    ...overrides,
  };
}

function makeRepo(overrides: Partial<WorkoutRepository> = {}): WorkoutRepository {
  const base: WorkoutRepository = {
    getById: vi.fn(),
    getByIdOrThrow: vi.fn(),
    listForUser: vi.fn(),
    create: vi.fn(),
    markFinished: vi.fn(),
  } as unknown as WorkoutRepository;
  return { ...base, ...overrides };
}

describe("workoutService.finish", () => {
  it("marks the workout finished when actor is the owner", async () => {
    const workout = makeWorkout();
    const markFinished = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({
      getByIdOrThrow: vi.fn().mockResolvedValue(workout),
      markFinished,
    });
    const service = createWorkoutService({
      repo,
      logger: silentLogger,
      now: () => new Date("2026-07-27T13:24:00Z"),
    });

    const result = await service.finish({
      actorUserId: "usr_owner",
      workoutId: workout.id,
      totalVolume: 12345,
    });

    expect(result).toEqual({
      workoutId: workout.id,
      finishedAt: new Date("2026-07-27T13:24:00Z"),
      durationSeconds: 5040,
    });
    expect(markFinished).toHaveBeenCalledWith(
      workout.id,
      new Date("2026-07-27T13:24:00Z"),
      { durationSeconds: 5040, totalVolume: 12345 },
    );
  });

  it("throws ForbiddenError when actor is not the owner", async () => {
    const workout = makeWorkout({ userId: "usr_other" });
    const markFinished = vi.fn();
    const repo = makeRepo({
      getByIdOrThrow: vi.fn().mockResolvedValue(workout),
      markFinished,
    });
    const service = createWorkoutService({ repo, logger: silentLogger });

    await expect(
      service.finish({
        actorUserId: "usr_intruder",
        workoutId: workout.id,
        totalVolume: 0,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(markFinished).not.toHaveBeenCalled();
  });

  it("propagates NotFoundError from the repo", async () => {
    const repo = makeRepo({
      getByIdOrThrow: vi.fn().mockRejectedValue(new NotFoundError("Workout")),
    });
    const service = createWorkoutService({ repo, logger: silentLogger });

    await expect(
      service.finish({ actorUserId: "usr_owner", workoutId: "missing", totalVolume: 0 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("clamps negative durations to zero when the clock is skewed", async () => {
    const workout = makeWorkout({ startedAt: new Date("2026-07-27T13:00:00Z") });
    const repo = makeRepo({
      getByIdOrThrow: vi.fn().mockResolvedValue(workout),
      markFinished: vi.fn().mockResolvedValue(undefined),
    });
    const service = createWorkoutService({
      repo,
      logger: silentLogger,
      now: () => new Date("2026-07-27T12:59:00Z"),
    });

    const result = await service.finish({
      actorUserId: "usr_owner",
      workoutId: workout.id,
      totalVolume: 0,
    });
    expect(result.durationSeconds).toBe(0);
  });
});
