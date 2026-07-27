# ADR-0002: Backend — Lovable Cloud (Supabase)

- **Status:** Accepted
- **Date:** 2026-07-27

## Context
Gymigo needs auth, a relational database, row-level authorization, and easy
publishing without operating infrastructure.

## Problem
Choose a backend that supports RLS, OAuth, and fits the Lovable platform.

## Options Considered
1. **Lovable Cloud (Supabase)** — Postgres + Auth + PostgREST; managed inside Lovable; native RLS.
2. **Firebase** — good auth, weaker relational modeling, no SQL RLS.
3. **Custom Node/Postgres** — full control, high ops cost.

## Decision
Lovable Cloud / Supabase.

## Consequences
- All authorization enforced by RLS. Every new table needs GRANTs + policies.
- Service-role key stays server-side; client uses publishable key.
- Roles live in `user_roles` table via `has_role()` — see ADR-0006.
- We must never reference Supabase to end users (Lovable Cloud branding).

## Future Considerations
If we outgrow Postgres primary + RLS (see plan.md §8), evaluate read replicas
and edge caching before switching platforms.
