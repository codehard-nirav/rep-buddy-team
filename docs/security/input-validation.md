# Input Validation

Every input that crosses a trust boundary is validated with Zod. No exceptions.

## Boundaries

1. **Server functions** — validate the `data` argument in `.inputValidator()` using `zodInput()` from `src/lib/validation.ts`.
2. **Server routes** (`src/routes/api/**`) — parse the request body/query with Zod inside the handler.
3. **Forms** — validate with Zod + `react-hook-form` (or manual) before submit; server still re-validates.
4. **Client → server sendContext** — never trusted; must be re-parsed server-side.

## Reusable primitives

Prefer `v.*` from `src/lib/validation.ts` so bounds stay consistent:

- `v.uuid()` — UUIDs from route params / foreign keys.
- `v.shortText(max)` — trimmed, non-empty, capped.
- `v.longText(max)` — trimmed, capped (used for notes, comments).
- `v.username()` — regex-checked, 2–32 chars.
- `v.email()` — trimmed, RFC-lite, max 255.
- `v.positiveNumber()`, `v.positiveInt()` — for weights, reps, durations.

## Rules

- **Never** call `dangerouslySetInnerHTML` on user content.
- **Always** cap length server-side; the DB does not enforce it.
- **Always** trim strings before persisting.
- **Never** pass unvalidated input to an external URL — use `encodeURIComponent`.
- **Never** log full request bodies (may contain PII); log correlation ID + validated fields.

## Example

```ts
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { zodInput, v } from "@/lib/validation";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const addCommentSchema = z.object({
  workoutId: v.uuid(),
  text: v.longText(2000),
});

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(zodInput(addCommentSchema))
  .handler(async ({ data, context }) => {
    // data is fully typed and validated here
  });
```

## Rate limiting for validated endpoints

Combine validation with `assertRateLimit(key, opts)` from `src/lib/rate-limit.ts` for user-visible write endpoints (comments, invites, follow toggles). See caveats in that file — this is per-instance, not global.
