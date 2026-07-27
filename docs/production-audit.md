# Production Audit — Gymigo

Final audit for the seven-workstream hardening initiative. Verifies each
workstream landed, catalogs what shipped, and lists remaining gaps with owners
so future work is unambiguous.

## Verification Snapshot

| Signal | Result |
|--------|--------|
| `bunx vitest run` | 4 files, 22/22 tests passing |
| `tsgo --noEmit` (project typecheck) | clean |
| `supabase linter` | no findings |
| Security scan findings from prior turn | resolved (4 fixed, no new criticals) |

## Workstream Ledger

| # | Workstream | Key artifacts |
|---|------------|---------------|
| 1 | Foundation | `src/lib/errors.ts`, `src/lib/logger.ts`, `correlationMiddleware`, ADRs 0001–0006, docs scaffold |
| 2 | Security | `src/lib/validation.ts`, `src/lib/rate-limit.ts`, `docs/security/{rls-audit,threat-model,input-validation}.md`, 4 RLS hardening fixes |
| 3 | Architecture | `src/lib/repositories/workout-repository.ts`, `src/lib/services/workout-service.ts`, `buildServices()`, layered-architecture docs |
| 4 | Database | 14 targeted secondary indexes, `docs/database/{indexes,query-performance}.md` |
| 5 | Observability | `src/lib/server-fn-logger.ts` (`withRequestLogger`), correlation-ID propagation, `docs/observability/server-functions.md` |
| 6 | Testing | `vitest.config.ts` + `tests/unit/*` (22 tests), `docs/testing/{running-tests,rls-testing}.md` |
| 7 | Final audit | This document |

## Reference-Quality Standards Enforced

- **Errors** — every failure path throws an `AppError` subclass with a stable
  `code`, `status`, `category`, and `expose` flag. `toAppError()` normalizes
  anything crossing a boundary.
- **Logging** — every server request stamped with a correlation ID; every
  authenticated server-fn adopts `withRequestLogger` for `context.log`.
  Event names are `<domain>.<action>[_<qualifier>]`, snake_case.
- **Validation** — Zod at every server-fn boundary via `zodInput()` +
  reusable `v.*` primitives. RLS is defense-in-depth, not the only gate.
- **Layers** — Routes → Server Functions → Services → Repositories, with the
  workout stack as the reference implementation. Legacy routes are tracked in
  `docs/architecture/refactor-backlog.md` for migration.
- **Data access** — repos enumerate columns, return DTOs, wrap Postgrest
  errors. No `select("*")`. No raw rows escaping to routes.
- **Rate limiting** — per-instance sliding window with explicit
  edge-isolation caveats; treat as spam deterrence, not a security control.
- **Docs-as-code** — every workstream shipped alongside `docs/` updates and
  templates so future features start from the same shape.

## Production Readiness Checklist

Go-live prerequisites already met:

- [x] All migrations idempotent, RLS on every public table, GRANTs paired.
- [x] Security definer helpers demoted to `SECURITY INVOKER`.
- [x] No open SELECT-`USING (true)` policies on user-linked tables.
- [x] Structured JSON logs on server, correlation IDs on requests + server fns.
- [x] Error page + Lovable error reporting wired.
- [x] Custom domain (`gymigo.fit`) documented in publish playbook.
- [x] Automated tests for pure logic layer (services / validation / errors).

## Remaining Gaps (Deferred, With Explicit Rationale)

- **External APM (Sentry / OTel)** — deferred per user scope (logging-only).
  Log pipeline is the aggregation point until an APM is wired.
- **Distributed rate limiting** — needs Redis or Durable Objects; not
  available today. Current limiter is per-worker-instance.
- **Automated RLS harness** — needs out-of-band Postgres access. Manual audit
  + SQL harness pattern documented in `docs/testing/rls-testing.md`.
- **Component / route tests** — pure-logic layer covered; UI tests planned
  once legacy routes migrate to the layered architecture.
- **Server-fn integration tests** — pattern is documented; concrete tests
  land alongside the first legacy route migrated per
  `docs/architecture/refactor-backlog.md`.
- **Feed / progress aggregations** — currently browser-side; watch p95 and
  move to Postgres views + partial indexes when > 100 workouts per user is
  the norm.
- **Comment sanitization** — plaintext today; add DOMPurify (or a strict
  Markdown renderer) before enabling any rich rendering.

## Reuse as a Blueprint

The pieces below are project-agnostic and can be lifted into future apps:

- `src/lib/errors.ts` + `logger.ts` + `validation.ts` + `rate-limit.ts`
- `src/lib/server-fn-logger.ts` (correlation-ID middleware pattern)
- Repository/service split (`repositories/workout-repository.ts` +
  `services/workout-service.ts` as the reference shape)
- `docs/` scaffold — architecture, security, database, observability,
  testing, playbooks, ADRs, templates
- `vitest.config.ts` + `tests/unit/` fixture patterns

## Next Owner Actions

1. Migrate one legacy route (start with **Coach**, per refactor backlog) into
   the layered stack — repo + service + server fn + tests.
2. Wire a Sentry (or equivalent) provider that consumes the existing
   correlation IDs; no code shape change required.
3. Add an automated RLS harness once a scratch Postgres role is available.
