# ADR-0003: Error handling strategy

- **Status:** Accepted
- **Date:** 2026-07-27

## Context
Errors currently surface as raw `Error` instances, Supabase `PostgrestError`
objects, or opaque `Response` throws. UI code hand-formats messages
inconsistently and logs lose context.

## Problem
We need a single error taxonomy so services, server fns, UI, and logs speak
the same vocabulary.

## Options Considered
1. **AppError hierarchy** (chosen) — one base class + typed subclasses with `code`, `status`, `category`, `expose`.
2. **Return-type errors** (Rust-style `Result`) — verbose in TS, poor ergonomics with async.
3. **Only stringly-typed codes** — no compile-time guarantees.

## Decision
Implement `src/lib/errors.ts` with `AppError`, `ValidationError`,
`UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`,
`RateLimitError`, `ExternalServiceError`. `toAppError(unknown)` normalizes.

## Consequences
- Services throw typed errors; server fns rely on `.status` for HTTP mapping.
- UI renders `err.publicMessage()`, never leaks internal messages.
- Logs record `{ code, category, status, message, stack, cause }`.
- All new code must adopt this — legacy paths are migrated per feature.

## Future Considerations
When Sentry lands (Workstream 5), tag events with `err.code` + `err.category`
for grouping.
