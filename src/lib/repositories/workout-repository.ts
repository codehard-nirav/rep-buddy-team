/**
 * Workout repository — thin data-access layer over Supabase.
 *
 * Rules:
 * - Enumerate columns explicitly; never `select("*")`.
 * - Return DTOs, never raw Postgrest rows.
 * - Wrap Postgrest errors in `AppError` with `cause`.
 * - No business logic here (that's the service's job).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { AppError, NotFoundError } from "@/lib/errors";

type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];

export interface WorkoutDTO {
  id: string;
  userId: string;
  routineId: string | null;
  name: string | null;
  notes: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  durationSeconds: number | null;
  totalVolume: number;
}

function toWorkoutDTO(row: WorkoutRow): WorkoutDTO {
  return {
    id: row.id,
    userId: row.user_id,
    routineId: row.routine_id,
    name: row.name,
    notes: row.notes,
    startedAt: new Date(row.started_at),
    finishedAt: row.finished_at ? new Date(row.finished_at) : null,
    durationSeconds: row.duration_seconds,
    totalVolume: Number(row.total_volume ?? 0),
  };
}

const WORKOUT_COLS =
  "id, user_id, routine_id, name, notes, started_at, finished_at, duration_seconds, total_volume, created_at";

function wrap(op: string, error: { message: string; code?: string }): never {
  throw new AppError({
    code: `WORKOUT_REPO_${op}`,
    message: error.message,
    status: 500,
    category: "internal",
    expose: false,
    cause: error,
  });
}

export function createWorkoutRepository(sb: SupabaseClient<Database>) {
  return {
    async getById(id: string): Promise<WorkoutDTO | null> {
      const { data, error } = await sb
        .from("workouts")
        .select(WORKOUT_COLS)
        .eq("id", id)
        .maybeSingle();
      if (error) wrap("READ_FAILED", error);
      return data ? toWorkoutDTO(data) : null;
    },

    async getByIdOrThrow(id: string): Promise<WorkoutDTO> {
      const w = await this.getById(id);
      if (!w) throw new NotFoundError("Workout");
      return w;
    },

    async listForUser(
      userId: string,
      opts: { limit?: number; offset?: number } = {},
    ): Promise<WorkoutDTO[]> {
      const limit = Math.min(opts.limit ?? 50, 200);
      const offset = opts.offset ?? 0;
      const { data, error } = await sb
        .from("workouts")
        .select(WORKOUT_COLS)
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) wrap("LIST_FAILED", error);
      return (data ?? []).map(toWorkoutDTO);
    },

    async create(input: {
      userId: string;
      routineId?: string | null;
      name?: string | null;
    }): Promise<WorkoutDTO> {
      const { data, error } = await sb
        .from("workouts")
        .insert({
          user_id: input.userId,
          routine_id: input.routineId ?? null,
          name: input.name ?? null,
        })
        .select(WORKOUT_COLS)
        .single();
      if (error) wrap("CREATE_FAILED", error);
      return toWorkoutDTO(data!);
    },

    async markFinished(
      id: string,
      finishedAt: Date,
      totals: { durationSeconds: number; totalVolume: number },
    ): Promise<void> {
      const { error } = await sb
        .from("workouts")
        .update({
          finished_at: finishedAt.toISOString(),
          duration_seconds: totals.durationSeconds,
          total_volume: totals.totalVolume,
        })
        .eq("id", id);
      if (error) wrap("FINISH_FAILED", error);
    },
  };
}

export type WorkoutRepository = ReturnType<typeof createWorkoutRepository>;
