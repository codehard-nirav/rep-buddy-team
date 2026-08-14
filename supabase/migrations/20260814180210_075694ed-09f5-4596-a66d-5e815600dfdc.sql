DROP POLICY IF EXISTS ch_select_all ON public.challenges;
CREATE POLICY ch_select_authenticated ON public.challenges
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS cc_update_client_respond ON public.coach_clients;
CREATE POLICY cc_update_client_respond ON public.coach_clients
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid() AND status = 'pending'::coach_client_status)
  WITH CHECK (
    client_id = auth.uid()
    AND status = ANY (ARRAY['active'::coach_client_status, 'declined'::coach_client_status])
  );