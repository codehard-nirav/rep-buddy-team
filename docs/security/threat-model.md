# Threat Model — Gymigo

STRIDE-lite. Focused on realistic threats given the current architecture (React SSR on Cloudflare Workers + Supabase with RLS).

## Assets

- User account (email, hashed password, OAuth link).
- Personal fitness data (workouts, sets, body measurements).
- Social graph (follows, comments, likes).
- Coach ↔ client relationships (grant access to another user's workouts).

## Trust boundaries

1. Browser ↔ TanStack server (SSR / server fns) — HTTPS, correlation ID.
2. Server ↔ Supabase Data API — Publishable key + user JWT; RLS enforced.
3. User ↔ user — enforced entirely by RLS; the client is untrusted.

## Threats

### Spoofing

- **Impersonating another user via `display_name`** → Mitigation: authorize by stable `user_id` (documented in engineering standards). Usernames are unique but mutable — never use as an auth key.
- **OAuth redirect hijack** → Mitigation: `redirect_uri` uses `window.location.origin`; do not accept user-supplied return URLs without allowlist.

### Tampering

- **Client sets `user_id` on insert** → RLS `WITH CHECK (user_id = auth.uid())` blocks it. Verified in RLS audit.
- **Client sends malicious server-fn context** → Mitigation: never trust `sendContext`; validate with Zod inside `.server()`.

### Repudiation

- No audit log yet. Logged via structured logger with correlation IDs — good enough for debugging, not compliance. ADR-TBD if we need audit trails.

### Information disclosure

- **Public profile enumeration** — accepted risk (social product).
- **Coach access after revocation** — `is_coach_of` reads `status = 'active'`; deleting/updating the row cuts access immediately.
- **Leaked error internals** — `AppError.expose = false` blocks internal messages from reaching clients.

### Denial of service

- No global rate limiting. Mitigations:
  - Per-instance in-memory limiter (`src/lib/rate-limit.ts`) for spammy actions (comments, invites, follow toggles).
  - Cloudflare WAF handles L7 volumetric attacks.
  - Supabase connection pool is the practical bottleneck — long-term move heavy aggregations to materialized views (see performance backlog).

### Elevation of privilege

- **Role escalation via `user_roles`** → UPDATE is denied; users can only insert/delete their own role rows, and the enum is closed. Admin role has no policies yet — must be granted server-side (out of scope until admin surface exists).
- **SECURITY DEFINER bypass** → All helpers are now SECURITY INVOKER (fixed 2026-07-27). Any new definer function must be reviewed and have `search_path` pinned.

## Assumptions

- Supabase manages password hashing, session tokens, refresh rotation.
- Cloudflare terminates TLS and provides DDoS L3/L4 protection.
- Users trust that follows/likes/comments are visible per profile privacy.

## Out of scope

- Native mobile clients (not shipped yet).
- Payment / billing surface (not implemented).
- Admin dashboard (not implemented).

## Review cadence

Re-review after: new external integration, new user role, new table with cross-user visibility, or a security incident.
