# Bug audit & fixes

Read every route (auth, onboarding, dashboard, workout log/detail, routines, programs, exercises, feed, coach, challenges, progress, history, measurements, settings, profile, u.$username), plus AppShell, __root, start.ts, and Supabase client. Typecheck passes; preview responds 200. Below are the real behavioral bugs I want to fix — nothing else touched.

## Bugs to fix

### High priority (broken feature / wrong data)

1. **Coach invite corrupts usernames** — `src/routes/_authenticated/coach.tsx`
   Field label is "Client @username" but code does `inviteEmail.replace("@","").split(".")[0]`, so `john.doe` becomes `john`. Fix: strip only a leading `@`, look up profile by the entered username as-is. Also block inviting yourself and duplicate active pairs.

2. **Dashboard "this week" is capped at 5** — `src/routes/_authenticated/dashboard.tsx`
   `week` is computed from the 5-row `recent` slice. Fix: query workouts in the last 7 days separately (`gte('started_at', 7 days ago)`) and use that count.

3. **Finish loses in-progress edits** — `src/routes/_authenticated/workout.$id.log.tsx`
   `NumInput` commits on blur. Clicking "Finish" while an input is focused skips the last commit, so `total_volume` is computed from stale query cache. Fix: on Finish, blur the active element, refetch `workout_sets`, then compute volume/PRs from the fresh rows.

4. **Rest-timer setting is ignored** — `src/routes/_authenticated/workout.$id.log.tsx`
   `profile.rest_timer_seconds` exists in settings but `RestTimer` hardcodes `[60, 90, 120, 180]`. Fix: read the current user's `rest_timer_seconds` and pre-select that duration (put it first in the chip list, keep the other presets).

5. **`/u/$username` renders "Loading…" forever for missing profiles** — `src/routes/_authenticated/u.$username.tsx`
   `queryFn` returns `null` when no profile matches, but the component only checks `!data` (still true) and shows the loading state indefinitely. Fix: distinguish `isLoading` from `data === null` and render a proper "profile not found" state.

6. **Workout log & detail display "kg" regardless of user units** — `src/routes/_authenticated/workout.$id.log.tsx`, `workout.$id.index.tsx`, feed & dashboard summary rows
   Values are stored as-entered but the label is hard-coded to "kg". Fix: read `profiles.units` once and render `kg`/`lb` accordingly on: log input placeholders, set list rows, workout detail volume stat, feed volume badge, dashboard "kg vol". No conversion — just label the value with the user's preferred unit.

### Medium priority

7. **PR detection double-marks after re-finish** — `workout.$id.log.tsx` `finish()`
   The "previous max" query does not exclude the current workout, and rows just inserted this session count as prior. Fix: filter `workouts.id != current workout id` when comparing to previous max, and only compare against workouts whose `finished_at` is not null (already done, but the current workout is still unfinished at that moment — safe, but adding the exclusion makes re-finishing idempotent).

8. **Auto-add loop on routine start can duplicate rows** — `workout.$id.log.tsx` bootstrap effect
   Effect fires when either `search.add` or `search.routine` changes. React strict-mode / re-run can call `addExercise` twice before the search param is cleared. Fix: use a ref/`useState` guard so bootstrap runs at most once per workout id.

9. **Signup navigates to `/onboarding` even when session is not yet created** — `src/routes/auth.tsx`
   With email confirmation on, `signUp` returns no session; `/onboarding` then bounces to `/auth`. Fix: only navigate to `/onboarding` when `data.session` is present; otherwise toast "Check your email to confirm" and stay on the auth screen.

10. **Coach invite allows self-invite & duplicate rows** — `coach.tsx`
    Nothing prevents inserting `(coach_id = me, client_id = me)` or re-inserting the same pending pair. Fix: reject when `clientId === meId`; check for an existing row before insert.

11. **Program day uniqueness** — `programs.$id.tsx`
    Adding two entries for the same (week, day) silently duplicates. Fix: upsert on `program_id + week_number + day_number` in the code path (replace existing row's `routine_id`/`label`). No schema change.

### Low priority (small correctness / UX)

12. **`challenges.tsx` variable shadowing** — inner `u` in `forEach` shadows the outer auth user; rename the inner variable to `agg` for clarity (no runtime effect, but confusing).

13. **`measurements.tsx` unit default doesn't follow type** — logging "waist" still defaults `unit` to `kg`. Fix: when `type` is one of `waist / chest / arm / thigh / hip`, default `unit` to `cm`; when `body_fat`, default to `%`.

14. **`workout.new.tsx` doesn't handle unauthenticated fallthrough** — `startEmpty`/`startFromRoutine` silently return if `auth.getUser()` fails. The route is under `_authenticated` so this is rare, but add a toast on error.

15. **Feed empty state is wrong when I follow no one but have my own workouts** — copy says "Follow other athletes to fill your feed" even when my own workouts show up. Fix: only show that empty state when the user follows 0 people AND has 0 completed workouts.

## Out of scope

- Design changes, new features, RLS/security work, capacitor/native shell, domain publishing.
- PR algorithm rewrite (weight-only heuristic stays as-is; only the "previous max" query is tightened in #7).
- Unit conversion between kg/lb (only the label follows the user's setting).

## Verification

After edits: `bunx tsgo --noEmit`, then a Playwright pass that signs in (via existing localhost injection if available), starts an empty workout, adds 2 exercises + 3 sets each with values, hits Finish, opens the detail screen, and screenshots dashboard/workout detail/feed/settings. Confirm week count, unit labels, and finish totals.
