/**
 * Standardized application error classes.
 *
 * Rules:
 * - Throw AppError subclasses from services / server fns.
 * - `code` is a stable machine-readable string (SCREAMING_SNAKE_CASE).
 * - `status` maps to HTTP status when the error crosses a network boundary.
 * - `expose` = true means the message is safe to show to end users; when
 *   false, callers should render a generic message and log the detail.
 * - `cause` chains the underlying error for logging.
 *
 * See docs/architecture/error-handling.md.
 */

export type ErrorCategory =
  | "validation"
  | "auth"
  | "authorization"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "external"
  | "internal";

export interface AppErrorOptions {
  code: string;
  message: string;
  status?: number;
  category?: ErrorCategory;
  expose?: boolean;
  cause?: unknown;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly category: ErrorCategory;
  readonly expose: boolean;
  readonly context?: Record<string, unknown>;

  constructor(opts: AppErrorOptions) {
    super(opts.message, { cause: opts.cause });
    this.name = new.target.name;
    this.code = opts.code;
    this.status = opts.status ?? 500;
    this.category = opts.category ?? "internal";
    this.expose = opts.expose ?? false;
    this.context = opts.context;
  }

  /** Message safe to show a user; falls back to a generic string. */
  publicMessage(): string {
    return this.expose ? this.message : "Something went wrong. Please try again.";
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      status: this.status,
      category: this.category,
      message: this.publicMessage(),
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown) {
    super({
      code: "VALIDATION_FAILED",
      message,
      status: 400,
      category: "validation",
      expose: true,
      context,
      cause,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must sign in to continue.", cause?: unknown) {
    super({ code: "UNAUTHORIZED", message, status: 401, category: "auth", expose: true, cause });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do that.", cause?: unknown) {
    super({
      code: "FORBIDDEN",
      message,
      status: 403,
      category: "authorization",
      expose: true,
      cause,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", cause?: unknown) {
    super({
      code: "NOT_FOUND",
      message: `${resource} not found.`,
      status: 404,
      category: "not_found",
      expose: true,
      cause,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, cause?: unknown) {
    super({ code: "CONFLICT", message, status: 409, category: "conflict", expose: true, cause });
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please slow down.", retryAfterSeconds?: number) {
    super({
      code: "RATE_LIMITED",
      message,
      status: 429,
      category: "rate_limit",
      expose: true,
      context: retryAfterSeconds ? { retryAfterSeconds } : undefined,
    });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, cause?: unknown) {
    super({
      code: "EXTERNAL_SERVICE_ERROR",
      message: `Upstream service ${service} failed.`,
      status: 502,
      category: "external",
      expose: false,
      cause,
    });
  }
}

/** Normalize any thrown value into an AppError. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    return new AppError({
      code: "INTERNAL_ERROR",
      message: err.message,
      cause: err,
      expose: false,
    });
  }
  return new AppError({
    code: "INTERNAL_ERROR",
    message: typeof err === "string" ? err : "Unknown error",
    expose: false,
  });
}
