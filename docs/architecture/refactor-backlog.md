# Refactor Backlog

Legacy routes still perform Supabase writes directly from the browser. These
work (RLS enforces safety) but should migrate to the service layer for
consistency, rate limiting, and audit logging.

Priority = user-visible write × cross-user impact.

| # | Route / Component                              | Op                      | Priority | Notes |
|---|------------------------------------------------|-------------------------|----------|-------|
| 1 | `_authenticated/coach.tsx`                     | Invite / accept client  | High     | Cross-user; add rate limit + Zod. |
| 2 | `_authenticated/feed.tsx` (like/comment)       | Comment insert, like    | High     | Spam-prone; needs rate limit + text validation (≤2000). |
| 3 | `_authenticated/workout.$id.log.tsx` (finish)  | Finish workout          | Medium   | Reference impl already exists as `workoutService.finish`. |
| 4 | `_authenticated/u.$username.tsx` (follow)      | Follow / unfollow       | Medium   | Rate limit against follow spam. |
| 5 | `_authenticated/settings.tsx`                  | Profile update          | Low      | RLS-scoped self write; Zod bounds for text fields. |
| 6 | `_authenticated/measurements.tsx`              | Body measurement insert | Low      | Self-scoped; add numeric bounds. |

## Migration recipe

For each row:

1. Add repo methods (`src/lib/repositories/<domain>-repository.ts`).
2. Add service methods (`src/lib/services/<domain>-service.ts`).
3. Wire in `src/lib/services/index.ts`.
4. Create `<domain>.functions.ts` server function using
   `requireSupabaseAuth` + `zodInput` + optional `assertRateLimit`.
5. Replace the component's direct `supabase.from(...)` call with
   `useServerFn(...)`.
6. Confirm the route still passes typecheck and manual smoke test.
7. Tick the row off in this table.

Do not batch multiple rows in one commit — each migration is small and
independently verifiable.
