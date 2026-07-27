# Layered Architecture

Gymigo separates concerns into four layers. Each layer depends only on the
layer below it — never upward, never sideways to a peer.

```text
┌──────────────────────────────────────────────────────────────┐
│  Routes / Components  (src/routes, src/components)           │
│    - Rendering, forms, URL state (validateSearch)            │
│    - Calls loaders + useServerFn; no Supabase imports        │
├──────────────────────────────────────────────────────────────┤
│  Server Functions  (*.functions.ts under src/lib)            │
│    - Auth middleware, Zod validation, rate limiting          │
│    - Builds services via buildServices(sb, logger)           │
├──────────────────────────────────────────────────────────────┤
│  Services  (src/lib/services)                                │
│    - Pure business rules. DI: { repo, logger, now }          │
│    - Throws AppError subclasses; never Supabase-aware        │
├──────────────────────────────────────────────────────────────┤
│  Repositories  (src/lib/repositories)                        │
│    - Postgrest calls, column enumeration, row → DTO mapping  │
│    - Wraps errors in AppError with cause                     │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
                    Supabase (RLS)
```

## Why these layers

- **Testability.** Services are pure — instantiate with an in-memory fake repo
  and a captured logger; no DB in unit tests.
- **Safety.** All DB access funnels through repositories. Adding a PII column
  can't accidentally leak because DTO mapping is explicit.
- **Consistency.** Errors and logging are handled the same way everywhere:
  repos wrap Postgrest failures, services enforce authorization, server fns
  translate to HTTP.

## Reference implementation

- `src/lib/repositories/workout-repository.ts` — data access + DTO mapping.
- `src/lib/services/workout-service.ts` — pure business logic, DI factory.
- `src/lib/services/index.ts` — `buildServices(sb, logger)` container built
  per request inside server function handlers.

## Rules

1. **Routes never import from `@/integrations/supabase/*` for writes.** Reads
   from the browser client are allowed for now (legacy code), but new mutations
   go through a server function → service.
2. **Services never import Supabase.** They depend only on repository
   interfaces + logger + injected clock.
3. **Repositories never contain business logic** — no ownership checks, no
   pricing math, no branching on user state. Only read/write + mapping.
4. **DTO mapping is explicit.** Never return a raw `Row`. Never `select("*")`.
5. **Every service throws `AppError` subclasses.** No `throw new Error(...)`.
6. **The service container is per-request.** Never a module-level singleton —
   it depends on the authenticated Supabase client and the request-scoped
   logger with its correlation ID.

## Adding a new capability

1. Add repo methods (`src/lib/repositories/<domain>-repository.ts`).
2. Add service methods (`src/lib/services/<domain>-service.ts`).
3. Wire it in `src/lib/services/index.ts`.
4. Add a server function in `<domain>.functions.ts` that:
   - Uses `requireSupabaseAuth` middleware if authenticated.
   - Validates input via `zodInput(schema)` from `@/lib/validation`.
   - Optionally calls `assertRateLimit()` from `@/lib/rate-limit`.
   - Builds services with `buildServices(context.supabase, requestLogger)`.
   - Delegates to `services.<domain>.<action>(...)`.
5. Call from routes via `useServerFn` or loaders under `_authenticated`.

## Migration path for legacy routes

Existing routes still talk to Supabase directly from the browser. This is
acceptable for RLS-scoped reads. Migrate any file that:

- Performs cross-user writes (comments, follows, coach invites).
- Enforces business rules in the component (finish-workout, program
  completion checks).
- Would benefit from server-side rate limiting or audit logging.

Track migrations in `docs/architecture/refactor-backlog.md`.
