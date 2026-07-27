# Indexes

Every table's primary and unique indexes are implicit. This file documents the
**secondary indexes** we've added to support the app's hot query paths.

Rule of thumb: add an index when a query pattern is (a) run per page load,
(b) run in a background loop, or (c) invoked from a policy expression. Do
not add speculative indexes — they slow writes and eat storage.

## Current secondary indexes

| Table                    | Index                             | Access pattern |
|--------------------------|-----------------------------------|----------------|
| `exercises`              | `exercises_muscles_idx` (GIN)     | Filter by primary muscle. |
| `exercises`              | `exercises_name_idx` (tsvector)   | Full-text search by name. |
| `workouts`               | `workouts_user_idx (user_id, started_at DESC)` | User's workout history feed. |
| `workout_sets`           | `workout_sets_workout_idx`        | Fetch sets for a workout. |
| `workout_sets`           | `workout_sets_exercise_idx`       | Volume/PR aggregates per exercise. |
| `workout_sets`           | `workout_sets_workout_order_idx (workout_id, exercise_id, set_number)` | Ordered display of sets. |
| `workout_sets`           | `workout_sets_pr_idx WHERE is_pr` | PR leaderboards (partial index). |
| `workout_comments`       | `workout_comments_workout_idx (workout_id, created_at DESC)` | Comment thread render. |
| `workout_comments`       | `workout_comments_author_idx`     | "My comments" surface. |
| `follows`                | `follows_followed_idx`            | Follower count / follower list. |
| `coach_clients`          | `coach_clients_client_idx`        | Client → coaches lookup. |
| `programs`               | `programs_owner_idx`              | Owner's program list. |
| `program_days`           | `program_days_program_idx (program_id, week_number, day_number)` | Ordered program render. |
| `program_assignments`    | `program_assignments_assigned_to_idx` / `_assigned_by_idx` | Assignment lookups. |
| `routines`               | `routines_owner_idx`              | Owner's routine list. |
| `routine_exercises`      | `routine_exercises_routine_idx (routine_id, order_index)` | Ordered routine render. |
| `body_measurements`      | `body_measurements_user_time_idx (user_id, logged_at DESC)` | Measurement charts. |
| `challenge_participants` | `challenge_participants_user_idx` | User's challenges. |
| `profiles`               | `profiles_privacy_idx WHERE privacy='public'` | Speeds up RLS visibility joins. |

## When adding a new query pattern

1. Run the query with `EXPLAIN (ANALYZE, BUFFERS)` via `supabase--read_query`.
2. If a sequential scan on a large table shows up, plan an index.
3. Add the migration:
   ```sql
   CREATE INDEX IF NOT EXISTS <table>_<cols>_idx
     ON public.<table> (<cols>);
   ```
   Use `IF NOT EXISTS` so the migration is idempotent. Do **not** use
   `CONCURRENTLY` — migrations run in a transaction.
4. Prefer **partial** indexes (`WHERE ...`) when only a small fraction of rows
   ever match the filter (e.g. `is_pr = true`).
5. Prefer **composite** indexes ordered `(equality_cols..., sort_col)` to serve
   both filter and order in one scan.
6. Re-run `EXPLAIN` and confirm `Index Scan` or `Index Only Scan`.
7. Document the new index in the table above.

## Anti-patterns

- **`select("*")` in repositories** — column enumeration + composite indexes
  make Index-Only Scans possible. `SELECT *` prevents them.
- **Indexing every FK** — only add if the reverse lookup is actually queried.
- **Indexing UUID columns without cause** — UUIDs randomize; large tables can
  see poor B-tree locality. Consider whether a covering composite is better.
- **Duplicate indexes** — `(a)` is redundant if `(a, b)` exists and queries
  filter by `a` only (leftmost prefix rule).

## Backlog

- Materialized view for monthly challenge leaderboards once
  `challenge_participants` × `workouts` cross-joins get expensive.
- Consider partitioning `workout_sets` by month once it exceeds ~50M rows.
