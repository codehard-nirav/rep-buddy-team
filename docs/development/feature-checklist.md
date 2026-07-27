# Feature Checklist

Use for every non-trivial feature. Order matters — bottom-up = fewer reworks.

## Design
- [ ] Requirements written (1–2 paragraphs, edge cases enumerated)
- [ ] ADR drafted if it introduces a new pattern
- [ ] Access matrix decided (who can read / write / admin)

## Data
- [ ] Migration created (tables, columns, enums)
- [ ] GRANTs to appropriate roles
- [ ] RLS enabled + policies written
- [ ] Indexes for new query shapes
- [ ] Migration reviewed for CHECK-vs-trigger mistakes

## Backend
- [ ] Zod schema in `src/lib/validation/`
- [ ] Repository in `src/lib/repositories/`
- [ ] Service in `src/lib/services/` (pure, testable)
- [ ] Server fn (if needed) in `<domain>.functions.ts`
- [ ] `logger.info` at success; `logger.error` on failure
- [ ] Rate limiter (Workstream 2) applied to expensive/public mutations

## Frontend
- [ ] `queryOptions` factory in `src/hooks/`
- [ ] Route uses `loader` → `ensureQueryData`, component uses `useSuspenseQuery`
- [ ] `errorComponent` + `notFoundComponent` on the route
- [ ] Form uses `zodResolver` bound to the same schema
- [ ] Empty / loading / error states designed

## Quality
- [ ] Unit tests: service + schema + edge cases
- [ ] Integration test: server fn happy path + unauthorized
- [ ] RLS test: owner allowed, non-owner denied, anonymous denied
- [ ] Accessibility: labels, roles, keyboard, contrast

## Docs
- [ ] API entry added to `docs/api/`
- [ ] Playbook or feature doc updated
- [ ] ADR merged if applicable
