# Query Performance

Guidelines for keeping the database fast as Gymigo scales.

## Measure first

- Use `supabase--slow_queries` to identify offenders ranked by total time.
- Run `EXPLAIN (ANALYZE, BUFFERS) <query>` via `supabase--read_query` to see
  the actual plan. Never guess.
- A `Seq Scan` on a table with more than ~10k rows is a smell; verify against
  the row estimate.

## Read patterns

### 1. Paginate everything user-facing

Do not `.select()` unbounded tables. Every list endpoint accepts `limit` and
`offset` (capped at 200) — see `workout-repository.ts` for the reference
implementation.

### 2. Column enumeration

Never `select("*")`. Enumerate columns so:
- New columns (PII, large text) don't leak by accident.
- Postgres can consider **Index-Only Scans** using covering indexes.

### 3. Aggregations belong on the server

Move browser-side aggregations (streak calculation, monthly volume, PRs,
leaderboards) to Postgres. Options in order of preference:

1. **Regular query with an index** — good up to ~1M rows per user.
2. **SECURITY INVOKER SQL function** — encapsulates the aggregation, still
   respects RLS.
3. **Materialized view** — for global aggregates (challenges, trending
   exercises) refreshed on a schedule.

Do **not** use a SECURITY DEFINER function for aggregates — it bypasses RLS
and requires manual auth checks.

### 4. Prefer `.maybeSingle()` over `.single()`

`.single()` throws when 0 rows match; that's a 400-level error, not a
program error. Use `.maybeSingle()` and handle `null` explicitly.

### 5. Avoid N+1 across relations

If a route fetches a list and then per-row detail, use a single query with
`select("*, related(*)")` or a JOIN via a view. Repository methods should
expose one-shot list-with-detail methods so callers can't accidentally
N+1.

## Write patterns

### 1. Batch inserts

`workout_sets` inserts happen many-at-once. Batch them:
```ts
await sb.from("workout_sets").insert(rows); // single round-trip
```
Never loop `insert()` per row.

### 2. Idempotent upserts

For join tables like `workout_likes` and `follows`, use `.upsert()` with the
composite primary key so double-clicks don't fail:
```ts
await sb.from("workout_likes").upsert({ workout_id, user_id });
```

### 3. Trigger-based derived data

`workouts.total_volume` and `workouts.duration_seconds` are currently
computed client-side. That is fine while the sets fit in memory. If we ever
need server-authoritative totals, add a trigger on `workout_sets` — not an
application-level recompute in the finish handler.

## Connection pool

Supabase caps concurrent Postgres connections. Rules:

- Every server function reuses the request-scoped `context.supabase` — no
  new clients per repository call.
- Never create a `SupabaseClient` at module scope inside a `.functions.ts`
  file. Doing so leaks connections and ships credentials to the client
  bundle.
- Long-running server functions (>5s) starve the pool; refactor into a
  server route with streaming, or move to a background job.

## Caching layers

We currently have none beyond TanStack Router's SWR loader cache and TanStack
Query's in-browser cache. Before adding server-side caching:

1. Confirm slow queries can't be fixed with an index or query rewrite.
2. Prefer HTTP `Cache-Control` on server routes for public reads.
3. Move to Cloudflare KV / Durable Objects only for high-fan-out global
   data (challenge leaderboards, trending exercises).

## RLS performance

RLS policies are re-evaluated per row. Keep policy predicates cheap:

- Prefer `= auth.uid()` over subqueries where possible.
- If a subquery is required, use a `SECURITY DEFINER STABLE` helper (like
  `is_coach_of`) so Postgres can memoize it.
- Ensure the columns referenced by policy predicates are indexed — a policy
  filtering `profiles.privacy = 'public'` benefits from `profiles_privacy_idx`.
