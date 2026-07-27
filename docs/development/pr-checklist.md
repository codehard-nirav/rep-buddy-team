# Pull Request Checklist

Copy into every PR description.

## Correctness
- [ ] Typecheck passes (`bun run build`)
- [ ] Lint passes (`bun run lint`)
- [ ] Manual smoke test of the changed flow

## Architecture
- [ ] Business logic lives in `src/lib/services/`, not in routes/components
- [ ] Data access lives in `src/lib/repositories/`
- [ ] Dependency direction respected (routes → hooks → services → repos)
- [ ] No new `any` / `as any`

## Data & Security
- [ ] Migration includes GRANTs + RLS policies for every new public table
- [ ] Indexes added for new query patterns
- [ ] Every mutation input validated with Zod
- [ ] No secrets in client bundle; `process.env` reads only inside server handlers
- [ ] No PII in log fields

## Testing
- [ ] Unit tests for new services / validation / utils
- [ ] Integration test for new server fns (auth + happy path)
- [ ] RLS test for new user-owned tables

## Observability
- [ ] `logger.info` for business events; `logger.error` at boundaries
- [ ] User-visible errors use `AppError.publicMessage()`

## Documentation
- [ ] `docs/` updated (feature doc, ADR, or playbook as appropriate)
- [ ] Route/API catalog updated if surface changed
- [ ] ADR added for any significant design decision
