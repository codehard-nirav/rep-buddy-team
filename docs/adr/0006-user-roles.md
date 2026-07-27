# ADR-0006: User roles in a separate `user_roles` table

- **Status:** Accepted
- **Date:** 2026-07-27

## Context
Storing role columns on `profiles` (or any user-owned table) enables
privilege escalation: any RLS policy that allows the user to `UPDATE` their
own profile also lets them set themselves to `admin`.

## Decision
Roles live in `public.user_roles(user_id, role app_role)`. Access is checked
via the `SECURITY INVOKER` helper `public.has_role(_user_id, _role)`. Users
can only read/insert their own role rows (except `admin`, which is set via
service role only).

## Consequences
- RLS policies use `public.has_role(auth.uid(), 'admin')`, not column reads.
- Client cannot elevate itself because `user_roles` insert of `admin` is blocked by policy.
- Recursive RLS is avoided (see infinite-recursion-in-rls guidance).

## Future Considerations
When we add coach/admin dashboards, add fine-grained roles to `app_role` and
migrate existing checks in one release.
