import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { logger, newCorrelationId } from "./lib/logger";
import { toAppError } from "./lib/errors";

// Assign a correlation ID to every server request and log its lifecycle.
const correlationMiddleware = createMiddleware().server(async ({ next }) => {
  const correlationId = newCorrelationId();
  const start = Date.now();
  try {
    const res = await next();
    logger.info("request.completed", { correlationId, durationMs: Date.now() - start });
    return res;
  } catch (error) {
    const err = toAppError(error);
    logger.error("request.failed", err, { correlationId, durationMs: Date.now() - start });
    throw error;
  }
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [correlationMiddleware, errorMiddleware, csrfMiddleware],
}));
