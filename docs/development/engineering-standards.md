# Engineering Standards

Reusable standards for this project and future ones. Keep this file
copy-paste portable.

## 1. Folder Structure

```
src/
├── routes/                  File-based TanStack routes (thin: loader + component)
├── components/              Presentational + shared UI
│   └── ui/                  shadcn primitives (do not edit directly)
├── hooks/                   Client hooks (useX, queryOptions factories)
├── lib/
│   ├── services/            Business logic (pure, framework-free)
│   ├── repositories/        Data access (Supabase → DTO)
│   ├── validation/          Zod schemas
│   ├── errors.ts            AppError classes
│   ├── logger.ts            Structured logger
│   └── utils.ts             Truly generic helpers only
├── integrations/            Auto-generated (Supabase client, types) — do not edit
└── styles.css               Tailwind v4 tokens
```

Dependency direction: **routes → hooks → services → repositories → integrations**.
Never import upward. Never import a peer's internals.

## 2. Naming

| Kind | Convention | Example |
|------|-----------|---------|
| Component | `PascalCase.tsx` | `WorkoutCard.tsx` |
| Hook | `useThing.ts`, camelCase export | `useWorkoutHistory` |
| Service | `<domain>-service.ts` | `workout-service.ts` |
| Repository | `<domain>-repository.ts` | `workout-repository.ts` |
| Zod schema | `<domain>.schema.ts`, exports `xSchema`, `XInput` | `workout.schema.ts` |
| Server fn | `<domain>.functions.ts` | `workout.functions.ts` |
| Server-only helper | `<name>.server.ts` | `admin-tasks.server.ts` |
| Test | co-located `<file>.test.ts` | `workout-service.test.ts` |

## 3. Type Safety

- `strict: true`. No new `any` — use `unknown` + narrowing.
- No `as any`. If a Supabase type is wrong, add a mapper in the repository.
- Public functions have explicit return types. Internal helpers may infer.
- DTOs live in `src/lib/repositories/<domain>-repository.ts` and are the only shape services/UI see.

## 4. Business Logic Rules

- Pure functions in `services/`. No `supabase`, `window`, or `Date.now()` at module scope.
- Inject clock/randomness for testability: `service.fn(deps, input)`.
- One place per rule: streak, 1RM, PR detection, volume, permissions.

## 5. Validation

- Every mutation input has a Zod schema in `src/lib/validation/`.
- Server fns call `schema.parse(data)` before calling services.
- Client forms use `zodResolver` from `@hookform/resolvers/zod` with the same schema.

## 6. Error Handling

- Throw `AppError` subclasses. Never return error tuples.
- Catch at boundaries (route error components, server-fn handlers) — not everywhere.
- `logger.error(event, err, ctx)` at the boundary before rethrowing or responding.

## 7. Logging

- Use `logger` from `@/lib/logger`. No raw `console.log` in production paths.
- Event names are `<domain>.<action>` snake_case.
- No PII in log fields — IDs only.

## 8. Testing

- Unit tests for every service, validation schema, and pure util.
- Integration tests for every server fn happy path + auth failure.
- RLS tests (Workstream 6) for every user-owned table.
- Names: `describe("thing", () => it("does X when Y", ...))`.

## 9. Commits & PRs

- One logical change per PR.
- Every PR runs through the [PR checklist](./pr-checklist.md).

## 10. What Not to Do

- No `useEffect` for initial data fetching. Use loaders + Query.
- No business logic in `.tsx` route files.
- No direct Supabase calls from components — go through hooks that wrap repos.
- No storing roles on `profiles` — use `user_roles` + `has_role()`.
- No client-side privilege checks — always confirm via RLS or server fn.
