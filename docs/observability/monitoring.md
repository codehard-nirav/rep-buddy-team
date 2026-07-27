# Monitoring & Alerting

Status: **Planned** — Sentry deferred per Workstream 1 scope. Structured
logging landed first so future monitoring has a stable event vocabulary.

## Current State

- Errors flow through `logger.error` + `reportLovableError` (editor telemetry).
- `src/lib/error-capture.ts` recovers stacks from h3-swallowed SSR errors.
- `src/lib/error-page.ts` renders a static 500 page.

## Planned (Workstream 5)

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
