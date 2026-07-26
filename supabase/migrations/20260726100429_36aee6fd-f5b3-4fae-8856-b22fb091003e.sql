
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('individual','coach','both','admin');
CREATE TYPE public.units_pref AS ENUM ('kg','lb');
CREATE TYPE public.privacy_pref AS ENUM ('public','private');
CREATE TYPE public.set_tag AS ENUM ('warmup','working','failure','dropset','negative','amrap','left','right');
CREATE TYPE public.coach_client_status AS ENUM ('pending','active','declined');
CREATE TYPE public.experience_level AS ENUM ('beginner','intermediate','advanced');
CREATE TYPE public.fitness_goal AS ENUM ('strength','hypertrophy','weight_loss','general');

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  units units_pref NOT NULL DEFAULT 'kg',
  privacy privacy_pref NOT NULL DEFAULT 'public',
  goal fitness_goal,
  experience experience_level,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  age INT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  rest_timer_seconds INT NOT NULL DEFAULT 90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (privacy='public' OR id=auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id=auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id=auth.uid());

-- =========================================================
-- USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (user_id=auth.uid());
CREATE POLICY "user_roles_insert_own" ON public.user_roles FOR INSERT WITH CHECK (user_id=auth.uid());
CREATE POLICY "user_roles_delete_own" ON public.user_roles FOR DELETE USING (user_id=auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

-- =========================================================
-- HANDLE NEW USER (auto profile)
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'individual');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- EXERCISES
-- =========================================================
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  primary_muscles TEXT[] NOT NULL DEFAULT '{}',
  secondary_muscles TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT,
  category TEXT, -- compound | isolation
  difficulty TEXT, -- beginner|intermediate|advanced
  instructions TEXT,
  media_url TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT SELECT ON public.exercises TO anon;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_select_all" ON public.exercises FOR SELECT USING (is_custom=false OR created_by=auth.uid());
CREATE POLICY "exercises_insert_own" ON public.exercises FOR INSERT WITH CHECK (created_by=auth.uid() AND is_custom=true);
CREATE POLICY "exercises_update_own" ON public.exercises FOR UPDATE USING (created_by=auth.uid());
CREATE POLICY "exercises_delete_own" ON public.exercises FOR DELETE USING (created_by=auth.uid());

CREATE INDEX exercises_name_idx ON public.exercises USING gin (to_tsvector('english', name));
CREATE INDEX exercises_muscles_idx ON public.exercises USING gin (primary_muscles);

-- =========================================================
-- ROUTINES (templates)
-- =========================================================
CREATE TABLE public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_template BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routines TO authenticated;
GRANT ALL ON public.routines TO service_role;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routines_select" ON public.routines FOR SELECT USING (owner_id=auth.uid() OR is_template=true);
CREATE POLICY "routines_mutate_own" ON public.routines FOR ALL USING (owner_id=auth.uid()) WITH CHECK (owner_id=auth.uid());
CREATE TRIGGER trg_routines_updated BEFORE UPDATE ON public.routines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  target_sets INT DEFAULT 3,
  target_reps INT DEFAULT 8,
  target_weight NUMERIC,
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routine_exercises TO authenticated;
GRANT ALL ON public.routine_exercises TO service_role;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routine_ex_via_routine" ON public.routine_exercises FOR ALL
USING (EXISTS(SELECT 1 FROM public.routines r WHERE r.id=routine_id AND (r.owner_id=auth.uid() OR r.is_template=true)))
WITH CHECK (EXISTS(SELECT 1 FROM public.routines r WHERE r.id=routine_id AND r.owner_id=auth.uid()));

-- =========================================================
-- PROGRAMS
-- =========================================================
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INT NOT NULL DEFAULT 4,
  is_template BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "programs_select" ON public.programs FOR SELECT USING (owner_id=auth.uid() OR is_template=true);
CREATE POLICY "programs_mutate_own" ON public.programs FOR ALL USING (owner_id=auth.uid()) WITH CHECK (owner_id=auth.uid());

CREATE TABLE public.program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  day_number INT NOT NULL,
  routine_id UUID REFERENCES public.routines(id) ON DELETE SET NULL,
  label TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_days TO authenticated;
GRANT ALL ON public.program_days TO service_role;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "program_days_via_program" ON public.program_days FOR ALL
USING (EXISTS(SELECT 1 FROM public.programs p WHERE p.id=program_id AND (p.owner_id=auth.uid() OR p.is_template=true)))
WITH CHECK (EXISTS(SELECT 1 FROM public.programs p WHERE p.id=program_id AND p.owner_id=auth.uid()));

CREATE TABLE public.program_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_assignments TO authenticated;
GRANT ALL ON public.program_assignments TO service_role;
ALTER TABLE public.program_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prog_assign_select" ON public.program_assignments FOR SELECT USING (assigned_to=auth.uid() OR assigned_by=auth.uid());
CREATE POLICY "prog_assign_insert" ON public.program_assignments FOR INSERT WITH CHECK (assigned_to=auth.uid() OR assigned_by=auth.uid());
CREATE POLICY "prog_assign_update" ON public.program_assignments FOR UPDATE USING (assigned_to=auth.uid() OR assigned_by=auth.uid());
CREATE POLICY "prog_assign_delete" ON public.program_assignments FOR DELETE USING (assigned_to=auth.uid() OR assigned_by=auth.uid());

-- =========================================================
-- COACH <-> CLIENT
-- =========================================================
CREATE TABLE public.coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status coach_client_status NOT NULL DEFAULT 'pending',
  invited_email TEXT,
  connected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (coach_id, client_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_clients TO authenticated;
GRANT ALL ON public.coach_clients TO service_role;
ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_select" ON public.coach_clients FOR SELECT USING (coach_id=auth.uid() OR client_id=auth.uid());
CREATE POLICY "cc_insert_coach" ON public.coach_clients FOR INSERT WITH CHECK (coach_id=auth.uid());
CREATE POLICY "cc_update_participant" ON public.coach_clients FOR UPDATE USING (coach_id=auth.uid() OR client_id=auth.uid());
CREATE POLICY "cc_delete_participant" ON public.coach_clients FOR DELETE USING (coach_id=auth.uid() OR client_id=auth.uid());

CREATE OR REPLACE FUNCTION public.is_coach_of(_coach UUID, _client UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.coach_clients WHERE coach_id=_coach AND client_id=_client AND status='active');
$$;

-- =========================================================
-- WORKOUTS
-- =========================================================
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES public.routines(id) ON DELETE SET NULL,
  name TEXT,
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_seconds INT,
  total_volume NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT ALL ON public.workouts TO service_role;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workouts_select" ON public.workouts FOR SELECT USING (
  user_id=auth.uid()
  OR public.is_coach_of(auth.uid(), user_id)
  OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=user_id AND p.privacy='public')
);
CREATE POLICY "workouts_mutate_own" ON public.workouts FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

CREATE TABLE public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INT NOT NULL DEFAULT 1,
  weight NUMERIC,
  reps INT,
  rpe NUMERIC,
  tag set_tag NOT NULL DEFAULT 'working',
  is_pr BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sets TO authenticated;
GRANT ALL ON public.workout_sets TO service_role;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sets_via_workout" ON public.workout_sets FOR ALL
USING (EXISTS(SELECT 1 FROM public.workouts w WHERE w.id=workout_id AND (
  w.user_id=auth.uid()
  OR public.is_coach_of(auth.uid(), w.user_id)
  OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=w.user_id AND p.privacy='public')
)))
WITH CHECK (EXISTS(SELECT 1 FROM public.workouts w WHERE w.id=workout_id AND w.user_id=auth.uid()));

CREATE INDEX workout_sets_workout_idx ON public.workout_sets(workout_id);
CREATE INDEX workout_sets_exercise_idx ON public.workout_sets(exercise_id);
CREATE INDEX workouts_user_idx ON public.workouts(user_id, started_at DESC);

-- =========================================================
-- BODY MEASUREMENTS
-- =========================================================
CREATE TABLE public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- weight, waist, arms, etc.
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_measurements TO authenticated;
GRANT ALL ON public.body_measurements TO service_role;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bm_own" ON public.body_measurements FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

-- =========================================================
-- FOLLOWS
-- =========================================================
CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select_all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (follower_id=auth.uid());
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (follower_id=auth.uid());

-- =========================================================
-- COMMENTS
-- =========================================================
CREATE TABLE public.workout_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_comments TO authenticated;
GRANT ALL ON public.workout_comments TO service_role;
ALTER TABLE public.workout_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wc_select" ON public.workout_comments FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.workouts w WHERE w.id=workout_id AND (
    w.user_id=auth.uid()
    OR public.is_coach_of(auth.uid(), w.user_id)
    OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=w.user_id AND p.privacy='public')
  ))
);
CREATE POLICY "wc_insert" ON public.workout_comments FOR INSERT WITH CHECK (author_id=auth.uid());
CREATE POLICY "wc_update_own" ON public.workout_comments FOR UPDATE USING (author_id=auth.uid());
CREATE POLICY "wc_delete_own" ON public.workout_comments FOR DELETE USING (author_id=auth.uid());

-- =========================================================
-- WORKOUT LIKES
-- =========================================================
CREATE TABLE public.workout_likes (
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workout_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.workout_likes TO authenticated;
GRANT ALL ON public.workout_likes TO service_role;
ALTER TABLE public.workout_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wl_select" ON public.workout_likes FOR SELECT USING (true);
CREATE POLICY "wl_insert_own" ON public.workout_likes FOR INSERT WITH CHECK (user_id=auth.uid());
CREATE POLICY "wl_delete_own" ON public.workout_likes FOR DELETE USING (user_id=auth.uid());

-- =========================================================
-- CHALLENGES
-- =========================================================
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  metric TEXT NOT NULL DEFAULT 'workouts', -- workouts | volume | streak
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO anon, authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ch_select_all" ON public.challenges FOR SELECT USING (true);

CREATE TABLE public.challenge_participants (
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.challenge_participants TO authenticated;
GRANT ALL ON public.challenge_participants TO service_role;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_select_all" ON public.challenge_participants FOR SELECT USING (true);
CREATE POLICY "cp_insert_own" ON public.challenge_participants FOR INSERT WITH CHECK (user_id=auth.uid());
CREATE POLICY "cp_delete_own" ON public.challenge_participants FOR DELETE USING (user_id=auth.uid());

-- =========================================================
-- SEED EXERCISES (~60 canonical exercises across muscle groups)
-- =========================================================
INSERT INTO public.exercises (name, slug, primary_muscles, secondary_muscles, equipment, category, difficulty, instructions) VALUES
('Barbell Back Squat','barbell-back-squat','{quadriceps,glutes}','{hamstrings,core,lower_back}','barbell','compound','intermediate','Bar on upper back, brace core, descend to parallel, drive up through mid-foot.'),
('Front Squat','front-squat','{quadriceps}','{glutes,core}','barbell','compound','intermediate','Bar racked on front delts, elbows high, squat down keeping torso vertical.'),
('Goblet Squat','goblet-squat','{quadriceps,glutes}','{core}','dumbbell','compound','beginner','Hold a dumbbell at chest, squat between the feet.'),
('Leg Press','leg-press','{quadriceps,glutes}','{hamstrings}','machine','compound','beginner','Press through mid-foot, control the descent, don''t lock out knees.'),
('Bulgarian Split Squat','bulgarian-split-squat','{quadriceps,glutes}','{hamstrings,core}','dumbbell','compound','intermediate','Rear foot on bench, lunge on front leg, drive through heel.'),
('Walking Lunges','walking-lunges','{quadriceps,glutes}','{hamstrings}','dumbbell','compound','beginner','Step forward into lunge, alternate legs while walking.'),
('Leg Extension','leg-extension','{quadriceps}','{}','machine','isolation','beginner','Extend knees against resistance, control the eccentric.'),
('Romanian Deadlift','romanian-deadlift','{hamstrings,glutes}','{lower_back}','barbell','compound','intermediate','Hinge at hips, slight knee bend, feel a hamstring stretch, drive hips forward.'),
('Conventional Deadlift','conventional-deadlift','{hamstrings,glutes,lower_back}','{traps,forearms}','barbell','compound','advanced','Bar over mid-foot, hips back, flat back, drive floor away.'),
('Sumo Deadlift','sumo-deadlift','{glutes,quadriceps}','{hamstrings,lower_back}','barbell','compound','advanced','Wide stance, hands inside knees, chest up, drive through the floor.'),
('Leg Curl','leg-curl','{hamstrings}','{}','machine','isolation','beginner','Curl the heels toward glutes, squeeze at the top.'),
('Hip Thrust','hip-thrust','{glutes}','{hamstrings}','barbell','compound','intermediate','Upper back on bench, bar over hips, drive hips up, squeeze glutes.'),
('Standing Calf Raise','standing-calf-raise','{calves}','{}','machine','isolation','beginner','Rise up onto toes, full range of motion, pause at top.'),
('Seated Calf Raise','seated-calf-raise','{calves}','{}','machine','isolation','beginner','Knees bent, raise heels against resistance.'),
('Barbell Bench Press','barbell-bench-press','{chest}','{triceps,shoulders}','barbell','compound','intermediate','Retract shoulder blades, bar to lower chest, press to lockout.'),
('Incline Bench Press','incline-bench-press','{chest,shoulders}','{triceps}','barbell','compound','intermediate','Incline 30-45deg, bar to upper chest, press upward.'),
('Dumbbell Bench Press','dumbbell-bench-press','{chest}','{triceps,shoulders}','dumbbell','compound','beginner','Lower dumbbells to chest level, press up and slightly together.'),
('Incline Dumbbell Press','incline-dumbbell-press','{chest,shoulders}','{triceps}','dumbbell','compound','beginner','Incline bench, press dumbbells up from chest level.'),
('Push-up','push-up','{chest}','{triceps,shoulders,core}','bodyweight','compound','beginner','Plank position, lower to floor, press back up.'),
('Cable Fly','cable-fly','{chest}','{shoulders}','cable','isolation','beginner','Slight forward lean, bring handles together in an arc.'),
('Dumbbell Fly','dumbbell-fly','{chest}','{shoulders}','dumbbell','isolation','beginner','Slight bend in elbows, open arms wide, squeeze chest to return.'),
('Chest Dip','chest-dip','{chest,triceps}','{shoulders}','bodyweight','compound','intermediate','Lean forward, dip down, press back up.'),
('Pull-up','pull-up','{lats,back}','{biceps}','bodyweight','compound','intermediate','Pull chest to bar, control descent.'),
('Chin-up','chin-up','{lats,biceps}','{back}','bodyweight','compound','intermediate','Underhand grip, pull chin over the bar.'),
('Lat Pulldown','lat-pulldown','{lats}','{biceps,back}','cable','compound','beginner','Pull the bar down to upper chest, squeeze lats.'),
('Barbell Row','barbell-row','{back,lats}','{biceps,rear_delts}','barbell','compound','intermediate','Hinge over, pull bar to lower ribs, squeeze back.'),
('Dumbbell Row','dumbbell-row','{lats,back}','{biceps}','dumbbell','compound','beginner','One hand on bench, row dumbbell to hip.'),
('Seated Cable Row','seated-cable-row','{back,lats}','{biceps,rear_delts}','cable','compound','beginner','Pull handle to abdomen, squeeze shoulder blades.'),
('T-Bar Row','t-bar-row','{back,lats}','{biceps}','barbell','compound','intermediate','Hinge over T-bar handle, row toward chest.'),
('Face Pull','face-pull','{rear_delts,traps}','{back}','cable','isolation','beginner','Pull rope to face, external rotation at end.'),
('Overhead Press','overhead-press','{shoulders}','{triceps,core}','barbell','compound','intermediate','Bar at collarbone, press straight overhead, lockout.'),
('Dumbbell Shoulder Press','dumbbell-shoulder-press','{shoulders}','{triceps}','dumbbell','compound','beginner','Press dumbbells overhead, controlled descent.'),
('Lateral Raise','lateral-raise','{shoulders}','{traps}','dumbbell','isolation','beginner','Raise dumbbells to shoulder height, slight forward lean.'),
('Rear Delt Fly','rear-delt-fly','{rear_delts}','{traps,back}','dumbbell','isolation','beginner','Bent over, raise dumbbells out to sides.'),
('Front Raise','front-raise','{shoulders}','{}','dumbbell','isolation','beginner','Raise dumbbells to front, shoulder height.'),
('Arnold Press','arnold-press','{shoulders}','{triceps}','dumbbell','compound','intermediate','Start palms facing you, rotate as you press up.'),
('Barbell Curl','barbell-curl','{biceps}','{forearms}','barbell','isolation','beginner','Elbows pinned, curl bar up, control down.'),
('Dumbbell Curl','dumbbell-curl','{biceps}','{forearms}','dumbbell','isolation','beginner','Alternate curls, supinate wrist as you lift.'),
('Hammer Curl','hammer-curl','{biceps,forearms}','{}','dumbbell','isolation','beginner','Neutral grip, curl dumbbells up.'),
('Preacher Curl','preacher-curl','{biceps}','{}','barbell','isolation','intermediate','Arms locked on pad, curl bar up with strict form.'),
('Cable Curl','cable-curl','{biceps}','{forearms}','cable','isolation','beginner','Cable curl with straight bar or rope, constant tension.'),
('Tricep Pushdown','tricep-pushdown','{triceps}','{}','cable','isolation','beginner','Elbows pinned, extend down, squeeze triceps.'),
('Overhead Tricep Extension','overhead-tricep-extension','{triceps}','{}','dumbbell','isolation','beginner','Dumbbell overhead, lower behind head, extend up.'),
('Skull Crusher','skull-crusher','{triceps}','{}','barbell','isolation','intermediate','Lying, elbows fixed, lower bar to forehead, extend.'),
('Close-Grip Bench Press','close-grip-bench-press','{triceps,chest}','{shoulders}','barbell','compound','intermediate','Hands shoulder-width, elbows tucked, press.'),
('Dips','dips','{triceps,chest}','{shoulders}','bodyweight','compound','intermediate','Upright torso, dip down, press back up.'),
('Plank','plank','{core}','{shoulders}','bodyweight','isolation','beginner','Forearms down, straight line hips to shoulders, brace hard.'),
('Hanging Leg Raise','hanging-leg-raise','{core}','{hip_flexors}','bodyweight','isolation','intermediate','Hang from bar, raise legs to horizontal or higher.'),
('Cable Crunch','cable-crunch','{core}','{}','cable','isolation','beginner','Kneel, hold rope, crunch down flexing abs.'),
('Russian Twist','russian-twist','{core,obliques}','{}','dumbbell','isolation','beginner','Seated, feet up, rotate side to side with weight.'),
('Ab Wheel Rollout','ab-wheel-rollout','{core}','{lats,shoulders}','other','isolation','intermediate','Roll out while bracing hard, roll back.'),
('Farmer''s Walk','farmers-walk','{forearms,traps}','{core,legs}','dumbbell','compound','beginner','Heavy DBs, walk with tall posture, tight core.'),
('Shrugs','shrugs','{traps}','{forearms}','dumbbell','isolation','beginner','Elevate shoulders straight up, pause, control down.'),
('Back Extension','back-extension','{lower_back}','{glutes,hamstrings}','bodyweight','isolation','beginner','Hinge over pad, extend to neutral, squeeze glutes.'),
('Kettlebell Swing','kettlebell-swing','{glutes,hamstrings}','{core,back}','kettlebell','compound','intermediate','Hinge and drive hips, swing bell to chest height.'),
('Box Jump','box-jump','{quadriceps,glutes}','{calves}','bodyweight','compound','intermediate','Explosive jump onto box, step down safely.'),
('Battle Ropes','battle-ropes','{shoulders,core}','{back,arms}','other','compound','beginner','Alternating waves, continuous power output.'),
('Rowing (Erg)','rowing-erg','{back,legs}','{core,arms}','machine','compound','beginner','Drive legs, then hips, then arms. Reverse the order back.'),
('Treadmill Run','treadmill-run','{legs}','{core}','machine','compound','beginner','Steady state or intervals.');
