# Template: Repository Module

```ts
// src/lib/repositories/<domain>-repository.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { AppError } from "@/lib/errors";

type Row = Database["public"]["Tables"]["workouts"]["Row"];

export interface WorkoutDTO {
  id: string;
  userId: string;
  startedAt: Date;
  finishedAt: Date | null;
  totalVolume: number;
}

function toDTO(row: Row): WorkoutDTO {
  return {
    id: row.id,
    userId: row.user_id,
    startedAt: new Date(row.started_at),
    finishedAt: row.finished_at ? new Date(row.finished_at) : null,
    totalVolume: Number(row.total_volume ?? 0),
  };
}

export function createWorkoutRepository(sb: SupabaseClient<Database>) {
  return {
    async getById(id: string): Promise<WorkoutDTO | null> {
      const { data, error } = await sb
        .from("workouts")
        .select("id, user_id, started_at, finished_at, total_volume")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new AppError({ code: "DB_READ_FAILED", message: error.message, cause: error });
      return data ? toDTO(data) : null;
    },

    async markFinished(id: string, at: Date): Promise<void> {
      const { error } = await sb
        .from("workouts")
        .update({ finished_at: at.toISOString() })
        .eq("id", id);
      if (error) throw new AppError({ code: "DB_WRITE_FAILED", message: error.message, cause: error });
    },
  };
}

export type WorkoutRepository = ReturnType<typeof createWorkoutRepository>;
```

## Rules
- Enumerate columns; never `select("*")` on tables with future PII columns.
- Map rows to DTOs at the repository boundary — services and UI never see raw rows.
- Wrap Postgrest errors in `AppError` with `cause`.
- No business logic here — only reads/writes + mapping.
