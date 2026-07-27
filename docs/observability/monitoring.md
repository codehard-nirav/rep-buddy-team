# Monitoring & Alerting

Status: **Logging-only** — per Workstream 5 scope, external APM (Sentry/OTel)
is intentionally deferred. Structured JSON events + correlation IDs are the
single source of truth; downstream aggregation happens in the log pipeline.

## Current State

- Every request stamped with a correlation ID in `src/start.ts`.
- Every authenticated server function binds `context.log` +
  `context.correlationId` via `withRequestLogger`.
- Errors flow through `logger.error` + `reportLovableError` (editor telemetry).
- `src/lib/error-capture.ts` recovers stacks from h3-swallowed SSR errors.
- `src/lib/error-page.ts` renders a static 500 page.

## Future (out of scope for W5)

| Signal | Tool | Alert |
|--------|------|-------|
| Frontend JS errors | Sentry (browser SDK) | Any new issue in prod → Slack |
| SSR/server-fn errors | Sentry (server SDK) via middleware | Error rate > 1% for 5m |
| Auth failures | `auth.sign_in_failed` log events | Spike > 5x baseline for 10m |
| Rate limit hits | `rate_limit.tripped` events | Any single IP > 100/min |
| Slow queries | Supabase slow-query view | p95 > 500ms |

## Troubleshooting Workflow

1. Reproduce with correlation ID from user report or Sentry event.
2. Filter logs by `correlationId`.
3. Chase `cause` chain in the innermost error record.
4. If DB-related, use `supabase--read_query` + `EXPLAIN ANALYZE`.
5. Document root cause in `docs/playbooks/postmortems/`.
