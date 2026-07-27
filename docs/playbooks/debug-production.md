# Playbook: Debug a Production Issue

## 0. Triage
- Get: user ID, route, approximate timestamp, correlation ID if user has it, browser + device.

## 1. Reproduce
- Try the exact flow on the preview URL as a signed-in test user.
- If not reproducible: it may be data-shape or auth-state specific.

## 2. Logs
- Filter server logs by `correlationId` (once available) or `userId`.
- Look for the nearest `error` record and follow the `cause` chain in `error.stack`.

## 3. Database
- If a query is suspect, run `EXPLAIN (ANALYZE, BUFFERS) …` via `supabase--read_query`.
- Check `supabase--slow_queries` for the last hour.
- Verify RLS: temporarily impersonate the user's `auth.uid()` in a read query.

## 4. Auth
- Ensure the user has a session (`getUser()` returns them).
- Verify `user_roles` for privilege issues.
- Check `handle_new_user` trigger fired if signup-related.

## 5. Client
- Grab console + network via preview tools.
- Look for stale query cache: does a hard reload fix it?

## 6. Fix + Postmortem
- Fix the category, not the instance — look for sibling routes / policies with the same bug.
- Write a postmortem in `docs/playbooks/postmortems/YYYY-MM-DD-<slug>.md` with:
  - Impact, timeline, root cause, remediation, prevention.
