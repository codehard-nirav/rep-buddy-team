# Playbook: Add a Feature

Follow top-to-bottom. Every step has a corresponding checklist item in
[`../development/feature-checklist.md`](../development/feature-checklist.md).

## 1. Design
- Write a 1-paragraph spec: user story, edge cases, access matrix.
- If it introduces a pattern (new integration, new layer), draft an ADR from `../templates/adr-template.md`.

## 2. Database
- Create migration: table + columns + enum values.
- Add GRANTs (`authenticated`, `service_role`; `anon` only if truly public).
- `ALTER TABLE … ENABLE ROW LEVEL SECURITY`.
- Add policies: owner-select, owner-write, admin overrides via `has_role()`.
- Add indexes for the query shapes you'll issue.

## 3. Validation
- Add schema in `src/lib/validation/<domain>.schema.ts`.
- Export `zSchema`, `Input = z.infer<typeof zSchema>`.

## 4. Repository
- `src/lib/repositories/<domain>-repository.ts`.
- One function per query; each returns a typed DTO.
- Never call `.select("*")` on user tables — enumerate columns.

## 5. Service
- `src/lib/services/<domain>-service.ts`.
- Pure business rules. Inject repo + clock + logger.
- Throw `AppError` subclasses.

## 6. Server function (if needed)
- `<domain>.functions.ts` — thin. Zod parse → service call → log.
- `.middleware([requireSupabaseAuth])` for signed-in routes.

## 7. Frontend
- `src/hooks/use-<domain>.ts` — `queryOptions` factory + mutation hooks.
- Route: loader calls `ensureQueryData`; component uses `useSuspenseQuery`.
- Form: `zodResolver(schema)`.
- Add `errorComponent` + `notFoundComponent`.

## 8. Tests
- Unit: service + schema (`bun test` — Workstream 6).
- Integration: server fn happy path + unauthorized.
- RLS: owner allowed, non-owner denied, anonymous denied.

## 9. Docs
- Add API entry to `docs/api/`.
- Update route catalog in `docs/architecture/routes.md`.
- Add ADR if a new pattern was introduced.

## 10. Ship
- Complete [`../development/pr-checklist.md`](../development/pr-checklist.md).
