# Database Overview

Full index audit belongs to **Workstream 4**. This is the schema map.

## Domains

| Domain | Tables |
|--------|--------|
| Identity | `profiles`, `user_roles` |
| Catalog | `exercises` |
| Routines | `routines`, `routine_exercises` |
| Programs | `programs`, `program_days`, `program_assignments` |
| Logging | `workouts`, `workout_sets`, `body_measurements` |
| Social | `follows`, `workout_likes`, `workout_comments` |
| Challenges | `challenges`, `challenge_participants` |
| Coaching | `coach_clients` |

## Helper Functions
- `has_role(_user_id uuid, _role app_role)` — `SECURITY INVOKER`, used by RLS.
- `is_coach_of(_coach uuid, _client uuid)` — `SECURITY INVOKER`, used by RLS.
- `handle_new_user()` — `SECURITY DEFINER` trigger; seeds `profiles` + default role.
- `set_updated_at()` — trigger.

## Enums
- `app_role` (individual, coach, both, admin)
- `coach_client_status` (pending, active, declined)
- `experience_level`, `fitness_goal`
- `privacy_pref` (public, private)
- `set_tag` (warmup, working, failure, dropset, negative, amrap, left, right)
- `units_pref` (kg, lb)

## Migration Rules
See [../playbooks/add-table.md](../playbooks/add-table.md). Every new `public`
table requires **GRANTs + RLS + policies in the same migration**.

## Index Audit (planned — Workstream 4)
Expected additions:
- `workouts (user_id, started_at DESC)`
- `workout_sets (workout_id)`
- `workout_sets (exercise_id, logged_at DESC)` — PR queries
- `follows (follower_id)`, `follows (followed_id)`
- `workout_likes (workout_id)`, `workout_likes (user_id)`
- `workout_comments (workout_id, created_at)`
- `body_measurements (user_id, type, logged_at DESC)`
