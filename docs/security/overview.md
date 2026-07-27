# Security Overview

Detailed audit belongs to **Workstream 2** — this file establishes the vocabulary.

## Layers
1. **Transport** — HTTPS everywhere; Lovable-provisioned certs.
2. **AuthN** — Supabase Auth (email/password + Google OAuth).
3. **AuthZ (coarse)** — TanStack `_authenticated/` layout gate.
4. **AuthZ (fine)** — Postgres RLS on every user-owned table.
5. **Server-side gates** — `requireSupabaseAuth` middleware on privileged server fns.
6. **Validation** — Zod on every mutation input (Workstream 2).
7. **Rate limiting** — Planned per ADR-0009.

## Non-goals (Currently)
- No MFA (planned).
- No HIBP password check (planned; toggle via `configure_auth`).
- No audit log table (planned).

## Data Classes
| Class | Examples | Storage rules |
|-------|----------|---------------|
| Public | `exercises` seed rows, public profiles | `anon` SELECT allowed |
| User-owned | `workouts`, `workout_sets`, `body_measurements` | `authenticated` SELECT scoped by `auth.uid()` |
| Sensitive | passwords, tokens | Managed by Supabase Auth only — never mirrored to `public` schema |

## Secrets Model
- Client bundle: only `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Server env: `SUPABASE_SERVICE_ROLE_KEY` — never exposed, never logged.
- `process.env.*` reads happen only inside server-fn handlers.

## See Also
- [ADR-0006 user roles](../adr/0006-user-roles.md)
- [Workstream 2 plan] (`docs/security/workstream-2.md`, added when work begins)
