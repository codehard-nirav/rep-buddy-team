# RLS Testing

RLS (Row-Level Security) policies are the last line of defense — if they break,
data leaks. Automated tests live outside the app repo because they require a
real Postgres role switch, which the app's client cannot do safely.

## Recommended matrix per user-owned table

For each user-scoped table, cover four cases:

| Case | Expected |
|------|----------|
| Owner reads own row | allowed |
| Owner writes own row | allowed |
| Other user reads private row | denied (0 rows) |
| Anonymous read | denied |

Additional cases for social tables:
- Public profile → row visible to other authenticated users.
- Coach with active `coach_clients` row → can read client's workouts.
- Coach whose relationship is `pending` or `declined` → cannot read.

## Approach

Use plain SQL via `psql` against a scratch database, or `pgTAP` for structured
output. Run inside a transaction that ends with `ROLLBACK` so tests never leave
residue.

```sql
BEGIN;
-- Impersonate a user
SELECT set_config('request.jwt.claim.sub', '<owner-uuid>', true);
SELECT set_config('role', 'authenticated', true);

-- Should return the row
SELECT count(*) FROM public.workouts WHERE id = '<workout-id>';

-- Switch to a different user
SELECT set_config('request.jwt.claim.sub', '<intruder-uuid>', true);

-- Should return 0
SELECT count(*) FROM public.workouts WHERE id = '<workout-id>';
ROLLBACK;
```

See `docs/security/rls-audit.md` for the full table inventory and the four
tables already hardened (`follows`, `workout_likes`, `challenge_participants`,
plus the `is_coach_of` / `has_role` invoker switch).

## Status

- **Unit + integration** — implemented (`bun test` / `bunx vitest run`).
- **RLS** — documented here; automated harness is future work because it
  requires out-of-band Postgres access. Manual queries via
  `supabase--read_query` cover the current audit.
