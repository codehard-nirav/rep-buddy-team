# Performance

Full audit lands in **Workstream 4**. Standards defined now so new code is
written to spec.

## Budgets
- LCP < 2.5s on 3G Fast (public marketing route).
- Initial JS < 200KB gzipped on public routes.
- Interactive (TTI) < 3.5s.
- p95 authenticated read < 300ms (server fn + DB).
- p95 authenticated write < 500ms.

## Rules
- No `useEffect(() => fetch(...))` for initial data — always loader + Query.
- Avoid N+1: prefer nested `select('a, sets:workout_sets(*)')` over sequential queries.
- No client-side aggregation over unbounded rows — push to SQL views or server fns.
- Images: WebP/AVIF where possible; `loading="lazy"` for below-the-fold.
- Route-level code splitting is automatic via TanStack Router — do not defeat it.

## Known Debt (from `.lovable/plan.md`)
- Feed pulls all followed users' workouts client-side.
- Progress/history load full `workout_sets` per user with no pagination.
- Streak / weekly count / PRs computed in browser.
- No composite indexes verified.

All are queued for Workstream 4.
