# Logging

## Goals

- Every server-side event is queryable as structured JSON.
- Every request carries a correlation ID so a full trace is one filter.
- Log level is configurable per environment without code changes.

## Log Shape

```json
{
  "ts": "2026-07-27T12:34:56.789Z",
  "level": "info",
  "event": "workout.finished",
  "correlationId": "8f1a...",
  "userId": "usr_...",
  "route": "/workout/123/log",
  "workoutId": "wk_123",
  "durationMs": 84_000
}
```

## Levels

| Level | Use |
|-------|-----|
| `debug` | Local dev diagnostics; disabled in prod. |
| `info` | Business events: signup, workout_started, workout_finished, coach_invite_sent. |
| `warn` | Recoverable degradation: retry succeeded, rate-limit near ceiling, deprecated path. |
| `error` | Unhandled exceptions, upstream failures, invariant violations. |

Configure via `LOG_LEVEL` (server env) or `VITE_LOG_LEVEL` (client env). Defaults to `info`.

## Correlation IDs

- Generated per incoming request in `src/start.ts` middleware.
- Injected into a per-request `logger.child({ correlationId, requestId })`.
- Passed to services via function args (not module-level singletons).
- Returned to the client in the `x-correlation-id` response header when useful.

## Event Naming

`<domain>.<action>[_<qualifier>]`, lowercase, snake_case for qualifier:

- `auth.signed_in`, `auth.sign_in_failed`
- `workout.started`, `workout.finished`, `workout.finish_failed`
- `coach.invite_sent`, `coach.invite_conflict`

Event names are the search key — treat them as an API.

## What Not to Log

- Never log passwords, access tokens, refresh tokens, cookies.
- Never log full row payloads from `profiles`, `body_measurements`, or messaging tables — log IDs.
- Never log service-role keys or secrets.

## See Also
- [ADR-0004 Structured logging](../adr/0004-structured-logging.md)
- [Error handling](../architecture/error-handling.md)
