# Testing Strategy

Full implementation lands in **Workstream 6**. Standards defined here so
future code is written in a testable shape today.

## Layers
1. **Unit** — pure services, validation schemas, utilities. Fast, isolated.
2. **Integration** — server functions with real Zod + real error mapping, mocked repositories.
3. **RLS** — SQL-level tests: owner allowed, non-owner denied, anonymous denied.
4. **Smoke / E2E** — happy-path browser walks via Playwright (post-deploy).

## Tools (planned)
- `vitest` for unit + integration
- `@testing-library/react` for component behavior tests
- `playwright` for E2E (already available in the sandbox)
- `pgTAP` or plain SQL tests for RLS

## Coverage Philosophy
Chase **coverage of critical paths**, not percentages:
- 100% of `src/lib/services/`
- 100% of `src/lib/validation/`
- Every server fn: 1 happy + 1 unauthorized + 1 validation-fail case.
- Every user-owned table: RLS matrix.

## Naming
- `describe("subject", () => it("verb + when-clause", ...))`.
- One behavior per `it`.
- Fixed clocks, seeded IDs. No `Math.random`, no wall-clock reads.

## What Not to Test
- shadcn/ui primitives (already tested upstream).
- Generated files (`src/routeTree.gen.ts`, Supabase `types.ts`).
- Trivial getters.

## See Also
- [`test-plan.md`](./test-plan.md) — master test plan: every page, every feature, with case IDs
- [`../templates/test-template.md`](../templates/test-template.md)
- [ADR-0010 Testing philosophy](../adr/0010-testing.md) *(planned)*

