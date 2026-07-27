/**
 * Server-function middleware that binds a request-scoped logger into
 * `context.log`. Compose after `requireSupabaseAuth` to also bind `userId`.
 *
 * Usage:
 *   export const finishWorkout = createServerFn({ method: "POST" })
 *     .middleware([requireSupabaseAuth, withRequestLogger])
 *     .inputValidator(...)
 *     .handler(async ({ data, context }) => {
 *       context.log.info("workout.finish_requested", { workoutId: data.id });
 *     });
 *
 * The correlation ID is generated per server-fn invocation. When the outer
 * request middleware (src/start.ts) already stamped one, prefer forwarding it
 * via the `x-correlation-id` header from the client for cross-boundary traces.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { logger, newCorrelationId, type Logger } from "./logger";

export const withRequestLogger = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const req = (() => {
      try {
        return getRequest();
      } catch {
        return undefined;
      }
    })();
    const headerId = req?.headers?.get("x-correlation-id") ?? undefined;
    const correlationId = headerId || newCorrelationId();
    const log: Logger = logger.child({ correlationId });
    const start = Date.now();
    log.debug("serverfn.started");
    try {
      const res = await next({ context: { log, correlationId } });
      log.debug("serverfn.completed", { durationMs: Date.now() - start });
      return res;
    } catch (err) {
      log.error("serverfn.failed", err, { durationMs: Date.now() - start });
      throw err;
    }
  },
);
