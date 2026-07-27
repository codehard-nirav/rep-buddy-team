# API Surface

## Current State
No `createServerFn` handlers or `/api/public/*` routes are implemented yet.
All reads/writes go directly to PostgREST from the browser via the
Supabase client, protected by RLS.

## Planned Server Functions (Workstream 3)

Once services + repositories land, migrate the following to
`createServerFn` for SSR, better error handling, and rate-limit enforcement:

| Domain | Function | Method | Auth |
|--------|----------|--------|------|
| Coach | `sendCoachInvite` | POST | required |
| Coach | `respondCoachInvite` | POST | required |
| Workout | `finishWorkout` | POST | required |
| Feed | `getFeedPage` | GET | required |
| Challenges | `getMonthlyLeaderboard` | GET | required |
| Progress | `getPersonalRecords` | GET | required |
| Profile | `lookupByUsername` | GET | public |

## Planned Server Routes (Workstream 5)

None yet. Cron / webhooks land under `src/routes/api/public/*` when needed.

## Contract Rules
- Every function: Zod `inputValidator` → `AppError` on failure.
- Every response: JSON-serializable DTO (no `Date` objects, no class instances).
- Error responses: HTTP status matches `err.status`; body = `err.toJSON()`.

Update this file whenever a server function is added or renamed.
