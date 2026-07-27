# ADR-0004: Structured logging with correlation IDs

- **Status:** Accepted
- **Date:** 2026-07-27

## Context
Prior logs were free-form `console.log` calls with no correlation, no level
filtering, and no schema. h3 SSR errors were captured but not standardized.

## Problem
We need a consistent, parseable log format that we can point at any log
pipeline later (Logflare, Grafana Loki, Sentry breadcrumbs).

## Options Considered
1. **Custom JSON logger** (chosen) — zero dependencies, works in browser + Worker.
2. **pino** — excellent, but Node-oriented; adds runtime concerns on Workers.
3. **Continue with console** — no consistency, non-queryable.

## Decision
`src/lib/logger.ts`. Every record is a single-line JSON object with
`ts, level, event, correlationId, userId, route, …`. `logger.child(bindings)`
creates request-scoped loggers. Levels: debug / info / warn / error.

## Consequences
- Event names become a searchable API — see [logging.md](../observability/logging.md).
- No PII fields; only IDs. Enforced by review.
- Sentry (Workstream 5) will consume the same events.

## Future Considerations
If we introduce OpenTelemetry, `correlationId` maps to trace ID and events
become spans.
