# RLS Audit — Gymigo

Reviewed: 2026-07-27. Re-audit after any migration touching `public.*` policies.

## Method

- Enumerate every `public.*` table.
- For each: confirm RLS enabled, GRANTs match policy scope, and each of SELECT / INSERT / UPDATE / DELETE is either policied or explicitly denied.
- Verify no policy uses `USING (true)` unless the data is intentionally public.
- Verify no policy self-references its own table (recursion → use SECURITY DEFINER helper).

## Findings (by table)

| Table                    | RLS | SELECT scope                          | Write scope                 | Notes |
|--------------------------|-----|---------------------------------------|-----------------------------|-------|
| `profiles`               | ✅  | Public profile OR self                | Self only (`id = auth.uid()`) | DELETE denied — profiles are lifecycle-tied to `auth.users`. |
| `user_roles`             | ✅  | Self                                  | Self insert/delete; UPDATE denied | Role escalation prevented — no UPDATE path. |
| `exercises`              | ✅  | Global (non-custom) OR owner          | Owner-only for custom       | `is_custom = true` enforced on insert. |
| `routines`               | ✅  | Owner OR template                     | Owner                       | |
| `routine_exercises`      | ✅  | Via parent routine                    | Via owner of routine        | |
| `programs` / `program_days` | ✅ | Owner OR template                    | Owner                       | |
| `program_assignments`    | ✅  | Assigner OR assignee                  | Same                        | |
| `coach_clients`          | ✅  | Coach OR client                       | Coach insert; either can update/delete | |
| `workouts`               | ✅  | Self OR coach-of-user OR public owner | Self only                   | Uses `is_coach_of()` SECURITY INVOKER helper. |
| `workout_sets`           | ✅  | Via workout visibility                | Via workout ownership       | |
| `body_measurements`      | ✅  | Self                                  | Self                        | Sensitive — never widened. |
| `follows`                | ✅  | Parties OR public profile             | Follower                    | Fixed 2026-07-27 (was `USING(true)`). |
| `workout_comments`       | ✅  | Via workout visibility                | Author                      | ⚠ Text unsanitized — see risks. |
| `workout_likes`          | ✅  | Self / owner / public                 | Self                        | Fixed 2026-07-27. |
| `challenges`             | ✅  | Public                                | Denied (admin-seeded)       | |
| `challenge_participants` | ✅  | Self OR public profile                | Self                        | Fixed 2026-07-27. |

## Open risks

1. **Comment XSS** — `workout_comments.text` is user input. Rendering must go through React's default text escaping (never `dangerouslySetInnerHTML`). Add server-side length cap (Zod, ≤2000).
2. **Enumeration** — `profiles_select_public` exposes usernames to unauth users if any public profile exists. Acceptable for a social product; document it.
3. **`is_coach_of` correctness** — depends on `coach_clients.status = 'active'`. Ensure clients can revoke by setting status to anything other than active.
4. **No admin surface yet** — the `admin` role in `app_role` has no policies attached. Add explicit `has_role(auth.uid(), 'admin')` grants before shipping any admin UI.

## Checklist for new tables

Before merging a migration:

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- [ ] `GRANT` matches policy scope (never grant `anon` unless intentional).
- [ ] SELECT policy scoped to `auth.uid()` or an intentional public rule.
- [ ] Write policies scoped to `auth.uid()`; `WITH CHECK` mirrors `USING`.
- [ ] No self-referential subqueries — use SECURITY DEFINER helper if needed.
- [ ] Row includes `user_id` (or equivalent) NOT NULL where ownership matters.
