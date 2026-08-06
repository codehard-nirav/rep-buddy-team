-- Coach/client status transitions
DROP POLICY IF EXISTS cc_update_participant ON public.coach_clients;

CREATE POLICY "cc_update_client_respond" ON public.coach_clients
FOR UPDATE TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid() AND status IN ('active','declined','pending'));

CREATE POLICY "cc_update_coach_cancel" ON public.coach_clients
FOR UPDATE TO authenticated
USING (coach_id = auth.uid() AND status <> 'active')
WITH CHECK (coach_id = auth.uid() AND status IN ('pending','declined'));

-- Comments/likes require visibility of the target workout
DROP POLICY IF EXISTS wc_insert ON public.workout_comments;

CREATE POLICY "wc_insert" ON public.workout_comments
FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_id
      AND (
        w.user_id = auth.uid()
        OR public.is_coach_of(auth.uid(), w.user_id)
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = w.user_id AND p.privacy = 'public')
      )
  )
);

DROP POLICY IF EXISTS wl_insert_own ON public.workout_likes;

CREATE POLICY "wl_insert_own" ON public.workout_likes
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_id
      AND (
        w.user_id = auth.uid()
        OR public.is_coach_of(auth.uid(), w.user_id)
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = w.user_id AND p.privacy = 'public')
      )
  )
);