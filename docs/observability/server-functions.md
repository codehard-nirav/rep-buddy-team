# Server Function Observability

Every authenticated server function should compose two middlewares:

1. `requireSupabaseAuth` — verifies the caller and puts `supabase`, `userId`,
   `claims` on `context`.
2. `withRequestLogger` — binds a request-scoped `context.log` and
   `context.correlationId`.

## Example

```ts
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withRequestLogger } from "@/lib/server-fn-logger";
import { zodInput, v } from "@/lib/validation";
import { buildServices } from "@/lib/services";
import { z } from "zod";

export const finishWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withRequestLogger])
  .inputValidator(zodInput(z.object({ workoutId: v.uuid })))
  .handler(async ({ data, context }) => {
    const services = buildServices(context.supabase, context.log);
    return services.workouts.finish({
      workoutId: data.workoutId,
      userId: context.userId,
    });
  });
```

## Correlation propagation

- Client can forward `x-correlation-id` from a prior action to stitch a
  multi-step trace (e.g. workout start → set logs → finish).
- Server generates a fresh ID when the header is missing.
- The ID is available as `context.correlationId` for services and
  `logger.child({ correlationId })` output.

## Standard events

| Event | Level | When |
|-------|-------|------|
| `serverfn.started` | debug | Middleware entry |
| `serverfn.completed` | debug | Middleware exit (success) |
| `serverfn.failed` | error | Middleware exit (throw) |
| `<domain>.<action>` | info | Business milestone inside `.handler()` |
| `rate_limit.tripped` | warn | `assertRateLimit` throws |

Use business events for anything a support engineer would ever want to search
by. Middleware-level events are only useful with a correlation ID filter.
