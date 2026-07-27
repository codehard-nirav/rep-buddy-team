-- Reverse follow lookup: "who follows this user"
CREATE INDEX IF NOT EXISTS follows_followed_idx ON public.follows (followed_id);

-- Coach clients: lookup by client (e.g. "who are my coaches")
CREATE INDEX IF NOT EXISTS coach_clients_client_idx ON public.coach_clients (client_id);

-- Program children: fetch by parent
CREATE INDEX IF NOT EXISTS program_days_program_idx
  ON public.program_days (program_id, week_number, day_number);
CREATE INDEX IF NOT EXISTS program_assignments_assigned_to_idx
  ON public.program_assignments (assigned_to);
CREATE INDEX IF NOT EXISTS program_assignments_assigned_by_idx
  ON public.program_assignments (assigned_by);
CREATE INDEX IF NOT EXISTS programs_owner_idx ON public.programs (owner_id);

-- Routine children ordered fetch
CREATE INDEX IF NOT EXISTS routine_exercises_routine_idx
  ON public.routine_exercises (routine_id, order_index);
CREATE INDEX IF NOT EXISTS routines_owner_idx ON public.routines (owner_id);

-- User-scoped time series
CREATE INDEX IF NOT EXISTS body_measurements_user_time_idx
  ON public.body_measurements (user_id, logged_at DESC);

-- Workout comments feed reads by workout, newest first
CREATE INDEX IF NOT EXISTS workout_comments_workout_idx
  ON public.workout_comments (workout_id, created_at DESC);
CREATE INDEX IF NOT EXISTS workout_comments_author_idx
  ON public.workout_comments (author_id);

-- Challenge participants reverse lookup (my challenges)
CREATE INDEX IF NOT EXISTS challenge_participants_user_idx
  ON public.challenge_participants (user_id);

-- Workout sets ordered fetch within a workout
CREATE INDEX IF NOT EXISTS workout_sets_workout_order_idx
  ON public.workout_sets (workout_id, exercise_id, set_number);

-- PR lookups by user/exercise (join workouts+workout_sets)
CREATE INDEX IF NOT EXISTS workout_sets_pr_idx
  ON public.workout_sets (exercise_id, is_pr)
  WHERE is_pr = true;

-- Profile privacy filter used in many RLS SELECT policies
CREATE INDEX IF NOT EXISTS profiles_privacy_idx
  ON public.profiles (privacy) WHERE privacy = 'public';