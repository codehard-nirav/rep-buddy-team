DROP VIEW IF EXISTS public.coach_invites;

CREATE TABLE public.coach_invite_emails (
  coach_client_id uuid PRIMARY KEY REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  invited_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_invite_emails TO authenticated;
GRANT ALL ON public.coach_invite_emails TO service_role;

ALTER TABLE public.coach_invite_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cie_select_coach" ON public.coach_invite_emails
FOR SELECT TO authenticated USING (coach_id = auth.uid());

CREATE POLICY "cie_insert_coach" ON public.coach_invite_emails
FOR INSERT TO authenticated WITH CHECK (coach_id = auth.uid());

CREATE POLICY "cie_delete_coach" ON public.coach_invite_emails
FOR DELETE TO authenticated USING (coach_id = auth.uid());

INSERT INTO public.coach_invite_emails (coach_client_id, coach_id, invited_email)
SELECT id, coach_id, invited_email FROM public.coach_clients WHERE invited_email IS NOT NULL;

ALTER TABLE public.coach_clients DROP COLUMN invited_email;