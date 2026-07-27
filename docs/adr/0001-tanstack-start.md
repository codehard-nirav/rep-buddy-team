# ADR-0001: Frontend framework — TanStack Start

- **Status:** Accepted
- **Date:** 2026-07-27

## Context
The project is a full-stack React app with SSR needs (SEO on public routes,
authenticated app under a gated layout) and runs on Cloudflare Workers.

## Problem
Pick a React meta-framework compatible with the Lovable / Cloudflare runtime.

## Options Considered
1. **TanStack Start v1** — file-based routing, typed loaders, server fns, first-class Query integration.
2. **Next.js** — mature, but heavier and less aligned with Workers deploy target.
3. **Remix / React Router** — also viable, but Lovable's template & tooling target TanStack.

## Decision
TanStack Start v1. Do not introduce `react-router-dom` or another router.

## Consequences
- Routes live in `src/routes/`; `src/routeTree.gen.ts` is auto-generated.
- Server logic uses `createServerFn` (RPC) and file routes under `src/routes/api/` (raw HTTP).
- Loaders + `ensureQueryData` are the initial-data pattern.
- Any framework swap is a large migration.

## Future Considerations
Reassess if TanStack Start dev stalls or if we adopt a mobile shell that changes routing.
