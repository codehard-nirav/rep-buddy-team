/**
 * Server-side wiring for services. Call from inside a server function's
 * `.handler()` where `context.supabase` and a request-scoped logger exist.
 *
 * Do NOT export a top-level singleton — services depend on a request's
 * authenticated Supabase client and logger.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Logger } from "@/lib/logger";
import { createWorkoutRepository } from "@/lib/repositories/workout-repository";
import { createWorkoutService } from "@/lib/services/workout-service";

export interface ServiceContainer {
  workouts: ReturnType<typeof createWorkoutService>;
}

export function buildServices(
  sb: SupabaseClient<Database>,
  logger: Logger,
): ServiceContainer {
  const workoutRepo = createWorkoutRepository(sb);
  return {
    workouts: createWorkoutService({ repo: workoutRepo, logger }),
  };
}
