# Playwright smoke tests

Config: [`playwright.config.ts`](../../playwright.config.ts) · Specs: `tests/e2e/`

Runs as the **Playwright smoke tests** job on every pull request and every push
to `main`, in parallel with the lint/typecheck/unit-test job.

## Coverage

| Spec | Flow | Needs test account |
|------|------|--------------------|
| `public.spec.ts` | Landing page renders (no runtime errors), auth page fields, protected route redirects to `/auth` | no |
| `login.spec.ts` | Bad credentials show an error; email + password sign-in lands on the dashboard | yes |
| `workout.spec.ts` | Start empty workout → editable name → add set → Finish; history page loads | yes |
| `progress.spec.ts` | Progress page renders without runtime errors; dashboard quick links reach Exercises and Progress | yes |

Public specs always run, so the job catches build/render/routing regressions
even with no credentials configured. Authenticated specs `test.skip` themselves
unless a test account is present — they never fail for a missing secret.

## Enabling the authenticated flows in CI

Add two repository secrets (Settings → Secrets and variables → Actions):

- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`

Use a dedicated, throwaway account created with email + password (a
Google-created account has no password and cannot sign in this way), with its
email already confirmed. Its data is written to by the workout spec, so do not
use a real athlete account.

Also add the publishable backend values as repository **Variables** so the app
talks to the real backend during the run: `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`. Never add the
service role key or database password.

## Running locally

```bash
bunx playwright install chromium   # once
bun run test:e2e                   # boots the dev server itself
bun run test:e2e:ui                # interactive runner
```

Against an already-running server (or a deployed URL):

```bash
E2E_BASE_URL=http://localhost:8080 bun run test:e2e
```

With the authenticated flows:

```bash
E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=... bun run test:e2e
```

`E2E_CHROMIUM_PATH` overrides the browser binary when the environment already
has one installed.

## Failure artifacts

Every failing test retains a screenshot, a video (`.webm`) and a trace
(`trace.zip`) under `test-results/<test-name>/`. Passing tests keep nothing.

In CI:

- `playwright-report-<attempt>` — HTML report + `junit.xml`, uploaded on every run.
- `playwright-failures-<attempt>` — screenshots, videos, traces and error
  context, uploaded only when the job fails (14-day retention).
- The job summary lists the captured files and links to
  [trace.playwright.dev](https://trace.playwright.dev) for opening `trace.zip`.

Locally, inspect the same data with `bunx playwright show-report` or
`bunx playwright show-trace test-results/<test>/trace.zip`.

## Nightly regression

`.github/workflows/nightly-e2e.yml` runs the full suite (public +
authenticated) every day at 02:30 UTC / 08:00 IST, and on manual dispatch with
an optional `base_url` input to point at a deployed environment.

- Non-blocking: the job is `continue-on-error`, so a red nightly never blocks
  PRs or releases — it is a signal to triage.
- Artifacts: `nightly-playwright-report-<run_id>` always, and
  `nightly-playwright-failures-<run_id>` (screenshots, videos, traces) for 30
  days when specs fail.
- Without `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` secrets the authenticated
  specs skip and the run logs a warning.




## See also

- [CI pipeline](./ci.md)
- [Manual test plan](../testing/test-plan.md)
