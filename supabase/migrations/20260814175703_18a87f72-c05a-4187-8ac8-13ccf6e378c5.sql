ALTER TABLE public.workouts
  ADD CONSTRAINT workouts_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.workout_comments
  ADD CONSTRAINT workout_comments_author_id_profiles_fkey
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;