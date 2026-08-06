-- 1. Restrict invited_email column reads; expose only to inviting coach via a view
REVOKE SELECT (invited_email) ON public.coach_clients FROM authenticated;
REVOKE SELECT (invited_email) ON public.coach_clients FROM anon;

CREATE OR REPLACE VIEW public.coach_invites
WITH (security_invoker = true) AS
SELECT id, coach_id, client_id, status, connected_at,
       CASE WHEN coach_id = auth.uid() THEN invited_email ELSE NULL END AS invited_email
FROM public.coach_clients
WHERE coach_id = auth.uid();

GRANT SELECT ON public.coach_invites TO authenticated;
GRANT ALL ON public.coach_invites TO service_role;

-- 2. Allow owners to delete their own profile
CREATE POLICY "profiles_delete_own" ON public.profiles
FOR DELETE TO authenticated
USING (id = auth.uid());