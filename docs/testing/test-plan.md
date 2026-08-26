# Gymigo — Master Test Plan

Manual + automated acceptance coverage for **every page and every feature**.

- Test IDs are stable: `AREA-nn`. Reference them in bug reports and PRs.
- Priority: **P0** blocks release, **P1** ship-blocker for the affected feature, **P2** polish.
- Every case is written as *Steps → Expected*. "Signed in" means an active session on `/dashboard`.
- Run the whole suite on: Chrome desktop (1440px), Safari iOS (390px), Android Chrome (412px).

## 0. Test Data & Environments

| Env | URL | Use |
|-----|-----|-----|
| Preview | `id-preview--<id>.lovable.app` | Feature verification during dev |
| Preview stable | `project--<id>-dev.lovable.app` | Regression pass before publish |
| Production | `gymigo.fit` | Post-publish smoke only (P0 cases) |

Accounts needed:

| Alias | Role | Notes |
|-------|------|-------|
| `athlete-a` | user | Public profile, has ≥5 finished workouts |
| `athlete-b` | user | Private profile, follows `athlete-a` |
| `coach-c` | coach | Has `athlete-a` as an active client |
| `fresh-d` | user | Never onboarded, no workouts (for empty states) |
| anon | — | Signed out browser, used for access-control cases |

Reset rule: never run destructive cases (delete profile, decline invite) on an account another case depends on.

---

## 1. Auth — `/auth`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| AUTH-01 | P0 | Open `/auth` signed out | Sign-in form renders; no flash of dashboard; no console errors |
| AUTH-02 | P0 | Email + password sign in with valid credentials | Full-screen "Signing you in" spinner, then `/dashboard`; form never reappears |
| AUTH-03 | P0 | Sign in with wrong password | Inline error "Invalid credentials"; form stays usable |
| AUTH-04 | P1 | Sign in with an unconfirmed email | Error explains confirmation is pending and offers "Resend" |
| AUTH-05 | P1 | Click "Resend" | Success toast; a new confirmation email arrives |
| AUTH-06 | P1 | Try password sign-in on a Google-created account | Message explains the account has no password and to use Google |
| AUTH-07 | P0 | Continue with Google, complete consent | Returns to `/auth`, spinner shown, lands on `/dashboard`; URL contains no `#access_token` |
| AUTH-08 | P0 | Sign up with a new email + password | Confirmation notice shown; after confirming, sign-in works and `/onboarding` runs |
| AUTH-09 | P1 | Sign up with an email already in use | Clear "already registered" message, no duplicate account |
| AUTH-10 | P1 | Submit with empty email / password | Native or inline validation blocks submit; no network request |
| AUTH-11 | P2 | Password field | Masked by default; toggle (if present) reveals |
| AUTH-12 | P0 | Visit `/auth` while already signed in | Immediate redirect to `/dashboard`, no form flash |
| AUTH-13 | P0 | Reload `/dashboard` after sign-in | Session persists; no bounce to `/auth` |
| AUTH-14 | P1 | Sign out from the app shell | Lands on `/`; visiting `/dashboard` now redirects to `/auth` |
| AUTH-15 | P1 | Screen reader / keyboard-only pass on the form | All fields labelled, tab order logical, submit reachable via Enter |

## 2. Route Guards & Access Control

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| GUARD-01 | P0 | Anon: open each of `/dashboard`, `/history`, `/progress`, `/routines`, `/programs`, `/exercises`, `/measurements`, `/feed`, `/challenges`, `/coach`, `/settings`, `/profile` | Each redirects to `/auth`; no protected data rendered even briefly |
| GUARD-02 | P0 | Anon: open `/`, `/auth`, `/onboarding`, `/robots.txt`, `/sitemap.xml` | All load without auth |
| GUARD-03 | P0 | `athlete-b`: open `/workout/<athlete-a workout id>` | Denied / not-found state, never another user's sets |
| GUARD-04 | P0 | `athlete-b`: open `/routines/<athlete-a routine id>` and `/programs/<id>` | Denied / not-found |
| GUARD-05 | P1 | Open `/u/<private user's username>` as a non-follower | Profile shows "private" state, no workouts or stats |
| GUARD-06 | P1 | Open a nonexistent route `/nope` | Branded 404, navigation still works |
| GUARD-07 | P1 | Open `/exercises/<bad uuid>` and `/workout/<bad uuid>` | Graceful not-found, no crash or infinite spinner |

## 3. Onboarding — `/onboarding`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| ONB-01 | P0 | First sign-in as `fresh-d` | Onboarding renders with a single H1 |
| ONB-02 | P0 | Complete all steps (name, username, units, goal) | Profile saved; lands on `/dashboard` with the chosen name shown |
| ONB-03 | P0 | Choose `lb` | All weights across app render in lb |
| ONB-04 | P1 | Submit a taken username | Inline error; submit blocked |
| ONB-05 | P1 | Submit an invalid username (spaces, symbols, <3 chars) | Validation error explaining the allowed format |
| ONB-06 | P1 | Reload mid-onboarding | No duplicate profile; user resumes without losing saved data |
| ONB-07 | P1 | Revisit `/onboarding` after completing it | Redirects to `/dashboard` (or shows completed state), never wipes the profile |

## 4. Landing Page & SEO — `/`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| MKT-01 | P1 | Load `/` signed out | Hero, logo, CTA render; exactly one H1 |
| MKT-02 | P1 | Click primary CTA | Navigates to `/auth` |
| MKT-03 | P1 | Load `/` signed in | Redirects to `/dashboard` (or shows an authenticated CTA), never a sign-in prompt |
| MKT-04 | P1 | View source | Unique title <60 chars, description <160, canonical, `og:*`, `twitter:card`, `SoftwareApplication` JSON-LD |
| MKT-05 | P1 | Fetch `/robots.txt` and `/sitemap.xml` | 200; sitemap lists only public routes and is valid XML |
| MKT-06 | P2 | Share the URL in Slack/WhatsApp | Preview shows the Gymigo splash image and copy |
| MKT-07 | P2 | Check the corner of the published site | No "Edit with Lovable" badge |
| MKT-08 | P2 | Lighthouse on `/` mobile | Performance ≥80, Accessibility ≥95, SEO 100 |

## 5. App Shell & Navigation

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| NAV-01 | P0 | Visit each nav item in turn | Correct page loads; active item highlighted |
| NAV-02 | P0 | Click the nav item for the page you are already on | Page data refetches and view scrolls to top |
| NAV-03 | P0 | Mobile: open the drawer, pick a different page | Drawer closes on navigation |
| NAV-04 | P0 | Mobile: open the drawer, pick the current page | Drawer closes and page refreshes |
| NAV-05 | P1 | Browser back/forward across 4+ pages | History is consistent; no blank screens |
| NAV-06 | P1 | Resize 1440 → 768 → 390 | Layout adapts, nothing overlaps or overflows horizontally |
| NAV-07 | P2 | Keyboard tab through the shell | Focus visible on every interactive element; drawer traps focus while open |
| NAV-08 | P1 | Logo click | Returns to `/dashboard` when signed in |

## 6. Dashboard — `/dashboard`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| DASH-01 | P0 | Open as `athlete-a` | Greeting with display name, summary tiles, recent workouts |
| DASH-02 | P0 | Open as `fresh-d` | Friendly empty state with a "Start workout" CTA, no zeros-looking-like-errors |
| DASH-03 | P0 | Click "Start workout" | Creates/opens a workout and lands on the logging screen |
| DASH-04 | P1 | Compare tile numbers against `/history` and `/progress` | Volume, workout count, and streak match |
| DASH-05 | P1 | Click a recent workout | Opens its summary at `/workout/<id>` |
| DASH-06 | P1 | Slow network (throttle 3G) | Skeleton/loading state, never an indefinite blank page |
| DASH-07 | P1 | Force a query failure (offline) | Error state with retry; app does not white-screen |
| DASH-08 | P2 | Unit switch to lb in settings, return | All dashboard weights re-render in lb |

## 7. Exercise Library — `/exercises`, `/exercises/new`, `/exercises/:id`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| EX-01 | P0 | Open the library | Seeded exercises list renders |
| EX-02 | P0 | Search "bench" | Results filter live, case-insensitive; clearing restores the full list |
| EX-03 | P1 | Filter by muscle group / equipment | Only matching exercises remain; combined filters intersect |
| EX-04 | P1 | Search a nonsense term | Empty state with a "create exercise" hint |
| EX-05 | P0 | Open an exercise detail | Name, muscles, and body map highlight render |
| EX-06 | P0 | Body map: front and back views | Correct muscles highlighted for both `male` and `female` map sets; no broken images (check Network) |
| EX-07 | P1 | Detail page: personal history section | Shows your past sets for that exercise, or an empty state |
| EX-08 | P1 | View source on a detail page | `head()` metadata present and `noindex` as designed |
| EX-09 | P0 | Create a custom exercise with valid data | Saved, appears in the library, usable in logging |
| EX-10 | P1 | Create with an empty name | Validation error; nothing saved |
| EX-11 | P1 | Create a duplicate name | Handled gracefully (error or allowed-with-warning), no crash |
| EX-12 | P0 | `athlete-b`: search for `athlete-a`'s custom exercise | Not visible (custom exercises stay private) |

## 8. Workout Logging — `/workout/new`, `/workout/:id/log`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| LOG-01 | P0 | Start an empty workout | Logging screen opens with a running elapsed timer |
| LOG-02 | P0 | Start from a routine | All routine exercises and target sets pre-populated in order |
| LOG-03 | P0 | Tap the workout title, type a name, blur | Name saves and persists after reload |
| LOG-04 | P1 | Rename with Enter key | Same as blur; field exits edit mode |
| LOG-05 | P1 | Rename to empty | Falls back to a sensible default, no blank title |
| LOG-06 | P0 | Add an exercise via search | Appears as a new block with one empty set |
| LOG-07 | P0 | Add a set, enter weight + reps | Values persist; totals update |
| LOG-08 | P0 | Delete a set / delete an exercise | Removed immediately and after reload; remaining set numbers stay sequential |
| LOG-09 | P0 | Tag sets Warmup, Drop, Failure | Tag badge shows; warmup excluded from working-volume totals |
| LOG-10 | P1 | Enter RPE | Saved and shown on the summary |
| LOG-11 | P1 | Enter invalid numbers (negative, 0 reps, text, 5000 kg) | Rejected or clamped with feedback; never written as NaN |
| LOG-12 | P0 | Check off a set | Set marks done and the rest timer auto-starts |
| LOG-13 | P0 | Uncheck a set | Done state clears; totals update |
| LOG-14 | P0 | Finish the workout | Navigates to the summary; no stuck loading state |
| LOG-15 | P0 | Finish, then reload the summary | All sets, tags, and duration persisted correctly |
| LOG-16 | P1 | Discard/cancel a workout | Workout removed; not present in history |
| LOG-17 | P0 | Reload mid-workout | Every logged set survives; timer resumes from the real start time |
| LOG-18 | P1 | Double-tap Finish quickly | Only one finished workout created |
| LOG-19 | P1 | Mobile 390px | Weight/reps inputs and the check button fit on one row without horizontal scroll |
| LOG-20 | P1 | Previous-set reference values | Last session's weight/reps shown as placeholder guidance for that exercise |
| LOG-21 | P1 | Log in lb with the account set to lb | Stored and re-displayed consistently; no silent kg/lb mix-up |

## 9. Rest Timer

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| RT-01 | P0 | Open the duration picker | OFF option, 0–60s in 1s steps, 1m05s–5m in 5s steps |
| RT-02 | P0 | Pick 1m30s, check off a set | Timer counts down from 1:30 |
| RT-03 | P0 | Set OFF, check off a set | No timer starts |
| RT-04 | P0 | −15s and +15s while running | Remaining time adjusts; never goes below 0 |
| RT-05 | P0 | Skip | Timer stops and clears immediately |
| RT-06 | P0 | Let it reach zero | Completion cue fires once (sound/vibration/visual), timer clears |
| RT-07 | P0 | Choose a duration, finish, start a new workout | Same duration remembered (persisted to profile) |
| RT-08 | P1 | Choose OFF, reload the page | Still OFF (not silently reset to a default) |
| RT-09 | P1 | Timer running, navigate away and back | Behaviour matches design (resumes or clears) with no duplicate timers |
| RT-10 | P2 | Background the tab for 30s | Remaining time is wall-clock accurate on return |

## 10. Routines — `/routines`, `/routines/:id`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| RT-A01 | P0 | Open routines list | Your routines listed; empty state for `fresh-d` |
| RT-A02 | P0 | Create a routine with exercises, sets, reps | Saved and visible in the list |
| RT-A03 | P0 | Open a routine | Exercises in the saved order with targets |
| RT-A04 | P0 | Edit: add/remove exercise, reorder, change targets | Changes persist after reload |
| RT-A05 | P0 | Delete a routine | Removed; past workouts created from it remain intact |
| RT-A06 | P0 | "Start workout" from a routine | New workout pre-filled correctly |
| RT-A07 | P1 | Save a routine with no name / no exercises | Validation error, nothing saved |
| RT-A08 | P0 | `athlete-b` opens `athlete-a`'s routine URL | Denied |

## 11. Programs — `/programs`, `/programs/:id`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| PRG-01 | P0 | Open programs list | Programs listed; empty state when none |
| PRG-02 | P0 | Create a program, add days, attach routines, save | Success toast; program appears with its days |
| PRG-03 | P0 | Reload the created program | All days and routine links persisted (no silent partial save) |
| PRG-04 | P0 | Save with a duplicate program name | Clear error toast, not a stuck spinner |
| PRG-05 | P0 | Save with a missing required field | Validation message; submit blocked |
| PRG-06 | P1 | Edit a day, remove a day | Persisted; order stays correct |
| PRG-07 | P1 | Delete a program | Removed; assignments cleaned up |
| PRG-08 | P1 | Start today's session from a program day | Opens a pre-filled workout |
| PRG-09 | P1 | Coach assigns a program to a client | Client sees it on their programs page |
| PRG-10 | P0 | `athlete-b` opens `athlete-a`'s program URL | Denied |

## 12. History — `/history`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| HIS-01 | P0 | Open history | Finished workouts newest-first with date, name, volume |
| HIS-02 | P0 | `fresh-d` | Empty state, no error |
| HIS-03 | P0 | Open a workout from history | Correct summary at `/workout/<id>` |
| HIS-04 | P1 | Log a new workout, return | It appears at the top without a manual refresh |
| HIS-05 | P1 | Account with 30+ workouts | Pagination/scroll works; no visible lag |
| HIS-06 | P2 | Unfinished workout in the list | Marked in-progress and resumable, not counted as completed |

## 13. Workout Summary — `/workout/:id`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| SUM-01 | P0 | Open a finished workout | Name, date, duration, exercises, all sets with tags |
| SUM-02 | P0 | Totals check | Volume/sets/reps match the logged data (warmups handled per rule) |
| SUM-03 | P0 | Author avatar + name | Renders via the profile join, no "could not embed" error |
| SUM-04 | P1 | Comment on your own workout | Comment appears with your name, persists after reload |
| SUM-05 | P1 | Like / unlike | Count increments and decrements, idempotent per user |
| SUM-06 | P1 | Loading and error states | Spinner while loading, error card with retry on failure |
| SUM-07 | P1 | Share/copy link (if present) | Copies the correct URL; toast confirms |

## 14. Progress & Stats — `/progress`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| PRO-01 | P0 | Open with data | Charts render (volume over time, per-exercise trend) |
| PRO-02 | P0 | `fresh-d` | Empty state, no broken/empty chart axes |
| PRO-03 | P0 | Switch exercise selector | Chart re-renders with that exercise's data only |
| PRO-04 | P1 | Change the date range | Data window updates and totals recompute |
| PRO-05 | P0 | PR / best-set values | Match the heaviest qualifying set in history |
| PRO-06 | P1 | Units = lb | Axes and labels in lb, values converted consistently |
| PRO-07 | P2 | Hover/tap a data point | Tooltip shows the correct date and value |
| PRO-08 | P1 | Mobile 390px | Charts fit, labels readable, no horizontal scroll |

## 15. Body Measurements — `/measurements`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| MEA-01 | P0 | Add a weight entry | Saved and shown in the list/chart |
| MEA-02 | P0 | Add other measurements (waist, arms, chest) | All persisted with correct units |
| MEA-03 | P1 | Unit defaults | Follows the profile preference (kg/cm vs lb/in) automatically |
| MEA-04 | P1 | Edit an entry | Updated everywhere including the chart |
| MEA-05 | P1 | Delete an entry | Removed; chart recomputes |
| MEA-06 | P1 | Invalid input (negative, text, absurd value) | Blocked with a message |
| MEA-07 | P1 | Two entries on the same date | Handled per design, no duplicate-key crash |
| MEA-08 | P0 | `athlete-b` cannot see `athlete-a` measurements | Only own data returned |

## 16. Social Feed — `/feed`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| SOC-01 | P0 | Open feed as `athlete-b` (follows `athlete-a`) | `athlete-a`'s public finished workouts appear |
| SOC-02 | P0 | Feed with no follows | Empty state suggesting people to follow |
| SOC-03 | P0 | Private user's workouts | Never appear to non-followers |
| SOC-04 | P0 | Like a feed item | Count updates, persists after reload, one like per user |
| SOC-05 | P0 | Comment on a feed item | Comment shows with the author's name and avatar |
| SOC-06 | P1 | Comment on a workout you cannot see (direct API attempt) | Rejected by policy |
| SOC-07 | P1 | Open a feed author's profile | `/u/<username>` loads |
| SOC-08 | P1 | Long feed | Scrolls smoothly; images lazy-load |

## 17. Public Profiles & Follows — `/u/:username`, `/profile`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| PROF-01 | P0 | Open your own `/profile` | Your stats, recent workouts, and edit access |
| PROF-02 | P0 | Open another public profile | Name, bio, stats, public workouts |
| PROF-03 | P0 | Follow / unfollow | Button state toggles; follower count updates; feed reflects it |
| PROF-04 | P0 | Private profile as a non-follower | Locked state only, no workout data in the network response |
| PROF-05 | P1 | Unknown username | Not-found state |
| PROF-06 | P1 | View source | Route-specific metadata present |
| PROF-07 | P1 | Follower/following lists | Only the permitted rows visible (no full follow-graph leak) |

## 18. Challenges — `/challenges`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| CHL-01 | P0 | Open challenges signed in | Challenge list renders |
| CHL-02 | P0 | Anon hits the challenges data | Denied (authenticated-only visibility) |
| CHL-03 | P0 | Join a challenge | Appears in your joined list; participant count updates |
| CHL-04 | P1 | Leave a challenge | Removed; count decrements |
| CHL-05 | P1 | Leaderboard | Ordered correctly; only permitted participants visible |
| CHL-06 | P1 | Log a qualifying workout | Your challenge progress updates |
| CHL-07 | P2 | No challenges available | Empty state |

## 19. Coaching — `/coach`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| CO-01 | P0 | `coach-c` opens the hub | Client list with invite controls |
| CO-02 | P0 | Invite by valid username/email | Pending invite created; only the coach can see the invited email |
| CO-03 | P0 | Invite yourself | Blocked with a clear message |
| CO-04 | P1 | Invite an invalid username format | Validation error |
| CO-05 | P1 | Invite an already-invited client | Handled without duplicate rows |
| CO-06 | P0 | Client accepts a pending invite | Relationship becomes active for both sides |
| CO-07 | P0 | Client declines a pending invite | Status declined; coach sees no client data |
| CO-08 | P0 | Client tries to re-activate a cancelled/declined relationship | Rejected by policy |
| CO-09 | P0 | Coach cancels a pending invite | Removed; cancelling an active client follows the designed path only |
| CO-10 | P0 | Coach opens an active client's workouts/progress | Read access works |
| CO-11 | P0 | Coach opens a non-client's data (direct URL/API) | Denied |
| CO-12 | P1 | Coach assigns a program to a client | Client sees the assignment |
| CO-13 | P1 | Non-coach opens `/coach` | Appropriate gated/empty state, no client data |

## 20. Settings — `/settings`

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| SET-01 | P0 | Open settings | Profile, preferences, and data cards load with current values |
| SET-02 | P0 | Change display name / username / bio (blur to save) | "Saved" toast; values persist after reload and show on your profile |
| SET-03 | P1 | Set a username already taken | Error toast; the old value is not lost |
| SET-04 | P0 | Switch units kg ↔ lb | Every weight in dashboard, logging, history, progress switches |
| SET-05 | P0 | Change the rest timer default | Reflected in the next workout's timer |
| SET-06 | P0 | Set privacy to private | Non-followers can no longer see your profile or feed items |
| SET-07 | P0 | Set privacy back to public | Visibility restored |
| SET-08 | P0 | Export workouts as CSV | File downloads; header row plus one row per set with correct values and escaped quotes |
| SET-09 | P1 | Export with zero workouts | Header-only CSV, no crash |
| SET-10 | P1 | Delete account/profile (if exposed) | Confirmation required; own data removed; session ends |

## 21. Cross-Cutting: Errors, Performance, Accessibility

| ID | Priority | Steps | Expected |
|----|----------|-------|----------|
| SYS-01 | P0 | Walk every page with the console open | Zero errors, zero React key/hydration warnings |
| SYS-02 | P0 | Go offline, then use each page | Error/retry states; no white screen |
| SYS-03 | P0 | Force a 500 from a server function | Branded error page/toast, correlation ID logged, no raw stack shown |
| SYS-04 | P1 | Check every page's `head()` | Unique title, description, `og:title`, `og:description` per route |
| SYS-05 | P1 | Keyboard-only pass across all pages | Everything reachable, visible focus rings, no traps |
| SYS-06 | P1 | Screen reader spot-check on forms | All inputs labelled; buttons have accessible names |
| SYS-07 | P1 | Colour contrast on the dark theme | Text ≥4.5:1 including the lime accent on dark surfaces |
| SYS-08 | P1 | Rapid repeated submits on write actions | Rate limiting kicks in with a friendly message, no duplicate rows |
| SYS-09 | P1 | Restore a session after 24h idle | Token refresh works or a clean re-auth prompt appears |
| SYS-10 | P2 | Images | Body maps and logo use correct dimensions and lazy-load below the fold |

## 22. Automated Coverage Map

| Layer | Runner | Covers | Command |
|-------|--------|--------|---------|
| Unit | Vitest | `src/lib/services`, `src/lib/validation`, `errors`, `rate-limit`, unit conversion | `bunx vitest run` |
| Component | Vitest + Testing Library | `RestTimer` (RT-01…RT-08), `BodyMap` (EX-06), `AppShell` nav (NAV-02…NAV-04) | `bunx vitest run` |
| RLS | SQL | GUARD-03/04, EX-12, MEA-08, SOC-03/06, CHL-02, CO-07/08/11 — owner allowed, other denied, anon denied per table | see [`rls-testing.md`](./rls-testing.md) |
| E2E smoke | Playwright | AUTH-02, AUTH-07, ONB-02, LOG-01→LOG-15, PRG-02/03, SET-08 | scripts under `/tmp/browser` |

## 23. Release Gate

Publish only when:

- All **P0** cases in sections 1–21 pass on preview stable.
- `bunx vitest run` is green.
- The RLS matrix is green for every user-owned table.
- The security scan shows no new critical findings.
- Post-publish: P0 smoke pass on `gymigo.fit` (AUTH-02, AUTH-07, DASH-01, LOG-14, SET-08).

## See Also

- [`overview.md`](./overview.md) — testing strategy and layers
- [`running-tests.md`](./running-tests.md)
- [`rls-testing.md`](./rls-testing.md)
- [`../development/pr-checklist.md`](../development/pr-checklist.md)
