# CI Pipeline

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

## When it runs
- Every pull request (any base branch)
- Every push to `main`
- Manually via **Actions → CI → Run workflow**

In-progress runs for the same PR are cancelled when a new commit is pushed.

## Steps
| Step | Command | Blocks merge |
|------|---------|--------------|
| Install | `bun install --frozen-lockfile` | yes |
| Lint | `bun run lint` | no (advisory) |
| Typecheck | `bun run typecheck` (`tsc --noEmit`) | yes |
| Test | `bun run test` (`vitest run`) | yes |
| Build | `bun run build` | yes |

Lint is advisory because of a large pre-existing Prettier/`no-explicit-any`
backlog (~1150 findings). Clear it with `bun run format` plus type fixes, then
set `continue-on-error: false` on the Lint step so it blocks too.

Any other failing step fails the job, and the PR shows a red
**Lint, typecheck, test, build** check.


Reproduce the whole pipeline locally with:

```bash
bun run ci
```

## Blocking merges (one-time GitHub setup)
The workflow reports status; GitHub enforces it. In the repository:

**Settings → Branches → Add branch ruleset** (or *Add rule*) for `main`:
1. Enable **Require a pull request before merging**.
2. Enable **Require status checks to pass before merging**.
3. Search for and select the check named **`Lint, typecheck, test, build`**.
4. Enable **Require branches to be up to date before merging**.
5. Save. Optionally enable **Do not allow bypassing the above settings** so admins are covered too.

The check name only appears in the search list after the workflow has run at least once, so open a throwaway PR first if needed.

## Build environment variables
The build needs the public `VITE_SUPABASE_*` values. CI falls back to harmless
placeholders, which is enough for a compile-only build. To build against the
real values, add repository **Variables** (Settings → Secrets and variables →
Actions → Variables): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`. These are publishable keys — never put the service
role key or database password in CI.

## Adding checks
Add a new test layer as an extra step in the `verify` job (or a parallel job).
If it becomes a separate job, add its name to the required status checks list
above, otherwise it will not block merges.

## See Also
- [`../testing/test-plan.md`](../testing/test-plan.md)
- [`./pr-checklist.md`](./pr-checklist.md)
