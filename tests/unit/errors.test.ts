/**
 * Unit tests for the AppError hierarchy + normalization.
 */
import { describe, it, expect } from "vitest";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  toAppError,
} from "@/lib/errors";

describe("AppError subclasses", () => {
  it("ForbiddenError has 403 + expose=true", () => {
    const e = new ForbiddenError();
    expect(e.status).toBe(403);
    expect(e.category).toBe("authorization");
    expect(e.expose).toBe(true);
    expect(e.publicMessage()).toBe(e.message);
  });

  it("NotFoundError includes the resource name", () => {
    const e = new NotFoundError("Workout");
    expect(e.message).toBe("Workout not found.");
    expect(e.status).toBe(404);
  });

  it("UnauthorizedError defaults to 401", () => {
    expect(new UnauthorizedError().status).toBe(401);
  });

  it("ValidationError carries issues in context", () => {
    const e = new ValidationError("bad", { issues: [{ path: ["id"] }] });
    expect(e.status).toBe(400);
    expect(e.context).toEqual({ issues: [{ path: ["id"] }] });
  });
});

describe("AppError.publicMessage", () => {
  it("hides internal messages when expose=false", () => {
    const e = new AppError({ code: "X", message: "secret detail", expose: false });
    expect(e.publicMessage()).not.toContain("secret detail");
  });
});

describe("toAppError", () => {
  it("passes AppError through unchanged", () => {
    const src = new ForbiddenError();
    expect(toAppError(src)).toBe(src);
  });

  it("wraps a raw Error", () => {
    const wrapped = toAppError(new Error("boom"));
    expect(wrapped).toBeInstanceOf(AppError);
    expect(wrapped.code).toBe("INTERNAL_ERROR");
    expect(wrapped.expose).toBe(false);
  });

  it("wraps a thrown string", () => {
    const wrapped = toAppError("oops");
    expect(wrapped.message).toBe("oops");
  });
});
