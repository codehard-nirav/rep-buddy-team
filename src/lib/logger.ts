/**
 * Structured JSON logger with correlation IDs.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("workout.finished", { workoutId, userId });
 *   logger.error("workout.finish_failed", err, { workoutId });
 *
 * Design:
 * - Emits one JSON object per log line (parseable in log pipelines).
 * - `correlationId` groups all logs for one request/action.
 * - `child()` creates a scoped logger that inherits base fields.
 * - Level filtering via LOG_LEVEL (server) or import.meta.env.VITE_LOG_LEVEL.
 * - In the browser, delegates to console with the same JSON shape.
 *
 * See docs/observability/logging.md.
 */

import { toAppError } from "./errors";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function resolveLevel(): LogLevel {
  const raw =
    (typeof process !== "undefined" && process.env?.LOG_LEVEL) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_LOG_LEVEL) ||
    "info";
  return (LEVELS[raw as LogLevel] ? raw : "info") as LogLevel;
}

const activeLevel = resolveLevel();

export interface LogContext {
  correlationId?: string;
  requestId?: string;
  userId?: string;
  route?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(event: string, data?: Record<string, unknown>): void;
  info(event: string, data?: Record<string, unknown>): void;
  warn(event: string, data?: Record<string, unknown>): void;
  error(event: string, err?: unknown, data?: Record<string, unknown>): void;
  child(bindings: LogContext): Logger;
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[activeLevel];
}

function emit(level: LogLevel, event: string, base: LogContext, data?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const record = {
    ts: new Date().toISOString(),
    level,
    event,
    ...base,
    ...data,
  };
  const line = safeStringify(record);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function safeStringify(record: unknown): string {
  try {
    return JSON.stringify(record);
  } catch {
    return JSON.stringify({ ts: new Date().toISOString(), level: "error", event: "log.stringify_failed" });
  }
}

function createLogger(base: LogContext = {}): Logger {
  return {
    debug: (event, data) => emit("debug", event, base, data),
    info: (event, data) => emit("info", event, base, data),
    warn: (event, data) => emit("warn", event, base, data),
    error: (event, err, data) => {
      const appErr = err != null ? toAppError(err) : undefined;
      emit("error", event, base, {
        ...data,
        ...(appErr && {
          error: {
            name: appErr.name,
            code: appErr.code,
            category: appErr.category,
            status: appErr.status,
            message: appErr.message,
            stack: appErr.stack,
          },
        }),
      });
    },
    child: (bindings) => createLogger({ ...base, ...bindings }),
  };
}

export const logger: Logger = createLogger();

/** Generate a URL-safe correlation ID. */
export function newCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
