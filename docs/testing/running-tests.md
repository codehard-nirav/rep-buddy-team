# Running Tests

```bash
bun test              # one-shot run (vitest run)
bunx vitest           # watch mode
bunx vitest run path  # single file
```

## Layout

```
tests/
├── unit/         Pure logic — services, validation, errors, utilities
└── integration/  Server functions with mocked repos (planned)
```

## Conventions

- One behavior per `it`; verb + when-clause naming.
- Inject clocks, IDs, and loggers — no `Date.now()` or `Math.random()`.
- Silent logger stub in unit tests (see `tests/unit/workout-service.test.ts`).
- Repositories are mocked at the interface boundary; never mock Supabase directly.
- Tests import from `@/lib/...` via the alias configured in `vitest.config.ts`.

## Current Coverage

| Area | File | Tests |
|------|------|-------|
| Error hierarchy | `tests/unit/errors.test.ts` | 8 |
| Validation primitives | `tests/unit/validation.test.ts` | 6 |
| Rate limiter | `tests/unit/rate-limit.test.ts` | 4 |
| Workout service | `tests/unit/workout-service.test.ts` | 4 |

RLS testing lives in [`rls-testing.md`](./rls-testing.md).
