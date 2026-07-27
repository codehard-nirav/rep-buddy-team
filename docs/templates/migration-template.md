# Template: Migration

```sql
-- Purpose: <one-line>
-- Tables affected: public.<name>
-- Access model: <who reads / writes / admin>

BEGIN;

CREATE TABLE public.<name> (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- domain columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.<name> TO authenticated;
GRANT ALL ON public.<name> TO service_role;

ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<name>_own" ON public.<name>
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX <name>_user_id_created_at_idx
  ON public.<name> (user_id, created_at DESC);

CREATE TRIGGER <name>_set_updated_at
  BEFORE UPDATE ON public.<name>
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
```

Cross-check with [`../playbooks/add-table.md`](../playbooks/add-table.md).
