/**
 * Zod validation helpers for server functions and forms.
 *
 * Usage:
 *   const schema = z.object({ id: z.string().uuid() });
 *   createServerFn().inputValidator(zodInput(schema)).handler(...)
 *
 * See docs/security/input-validation.md.
 */
import { z, type ZodTypeAny, type infer as zInfer } from "zod";
import { ValidationError } from "./errors";

export function zodInput<S extends ZodTypeAny>(schema: S) {
  return (data: unknown): zInfer<S> => {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new ValidationError("Invalid input.", {
        context: { issues: result.error.issues },
        cause: result.error,
      });
    }
    return result.data;
  };
}

/** Common primitives — reuse to keep bounds consistent across the app. */
export const v = {
  uuid: () => z.string().uuid(),
  shortText: (max = 200) => z.string().trim().min(1).max(max),
  longText: (max = 4000) => z.string().trim().max(max),
  username: () =>
    z
      .string()
      .trim()
      .min(2)
      .max(32)
      .regex(/^[a-zA-Z0-9_.-]+$/, "Letters, numbers, _, ., - only"),
  email: () => z.string().trim().email().max(255),
  positiveNumber: () => z.number().finite().nonnegative(),
  positiveInt: () => z.number().int().nonnegative(),
};
