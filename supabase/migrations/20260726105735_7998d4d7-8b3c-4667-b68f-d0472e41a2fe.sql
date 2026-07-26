
-- Switch SECURITY DEFINER helpers to SECURITY INVOKER so authenticated callers
-- cannot escalate; RLS on underlying tables still permits legitimate lookups.
ALTER FUNCTION public.has_role(uuid, app_role) SECURITY INVOKER;
ALTER FUNCTION public.is_coach_of(uuid, uuid) SECURITY INVOKER;

-- Tighten follows visibility
DROP POLICY IF EXISTS follows_select_all ON public.follows;
CREATE POLICY follows_select_visible ON public.follows
FOR SELECT TO authenticated
USING (
  follower_id = auth.uid()
  OR followed_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = follows.followed_id AND p.privacy = 'public'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = follows.follower_id AND p.privacy = 'public'
  )
);

-- Tighten workout_likes visibility
DROP POLICY IF EXISTS wl_select ON public.workout_likes;
CREATE POLICY wl_select_visible ON public.workout_likes
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workouts w
    JOIN public.profiles p ON p.id = w.user_id
    WHERE w.id = workout_likes.workout_id
      AND (w.user_id = auth.uid() OR p.privacy = 'public')
  )
);

-- Tighten challenge_participants visibility
DROP POLICY IF EXISTS cp_select_all ON public.challenge_participants;
CREATE POLICY cp_select_visible ON public.challenge_participants
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = challenge_participants.user_id AND p.privacy = 'public'
  )
);
