# Playbook: Add a Database Table

## Migration Skeleton

```sql
CREATE TABLE public.<name> (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- domain columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GRANTs FIRST — PostgREST returns permission errors without them.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<name> TO authenticated;
GRANT ALL ON public.<name> TO service_role;
-- Add anon only if some rows are intentionally public.

ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<name>_own"
  ON public.<name>
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for expected query shapes
CREATE INDEX <name>_user_id_created_at_idx
  ON public.<name> (user_id, created_at DESC);

-- updated_at trigger
CREATE TRIGGER <name>_set_updated_at
  BEFORE UPDATE ON public.<name>
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## Checklist
- [ ] `CREATE TABLE` in `public`
- [ ] GRANTs in the SAME migration
- [ ] `ENABLE ROW LEVEL SECURITY`
- [ ] Per-role policies (never `USING (true)` for user data)
- [ ] Composite indexes for `(user_id, sort_col)` queries
- [ ] `updated_at` trigger if the column exists
- [ ] Never `ALTER DATABASE postgres …` (rejected)
- [ ] Never CHECK constraints with `now()`, `current_setting()`, etc. — use triggers

## Gotchas
- CHECK constraints must be immutable; time-dependent rules go in `BEFORE INSERT/UPDATE` triggers.
- Store roles in `user_roles`, never on the row itself (see ADR-0006).
- Never grant `anon` on a user-owned table.
