/**
 * Unit tests for validation primitives.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodInput, v } from "@/lib/validation";
import { ValidationError } from "@/lib/errors";

describe("zodInput", () => {
  const schema = z.object({ id: v.uuid(), name: v.shortText(50) });
  const validate = zodInput(schema);

  it("returns parsed data on success", () => {
    const out = validate({ id: "00000000-0000-4000-8000-000000000000", name: "Push Day" });
    expect(out.name).toBe("Push Day");
  });

  it("throws ValidationError on failure", () => {
    expect(() => validate({ id: "not-a-uuid", name: "x" })).toThrowError(ValidationError);
  });

  it("trims short text", () => {
    const out = validate({ id: "00000000-0000-4000-8000-000000000000", name: "  Legs  " });
    expect(out.name).toBe("Legs");
  });
});

describe("v.username", () => {
  const validate = zodInput(z.object({ u: v.username() }));

  it("accepts letters/numbers/._-", () => {
    expect(validate({ u: "gym_igo.01-x" }).u).toBe("gym_igo.01-x");
  });

  it("rejects spaces and symbols", () => {
    expect(() => validate({ u: "bad name" })).toThrow(ValidationError);
    expect(() => validate({ u: "bad!" })).toThrow(ValidationError);
  });

  it("enforces length bounds", () => {
    expect(() => validate({ u: "a" })).toThrow(ValidationError);
    expect(() => validate({ u: "a".repeat(33) })).toThrow(ValidationError);
  });
});
