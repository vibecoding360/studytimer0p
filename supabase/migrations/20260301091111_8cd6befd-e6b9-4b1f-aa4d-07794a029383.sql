-- Fix: Replace all RESTRICTIVE policies with PERMISSIVE ones

-- courses
DROP POLICY IF EXISTS "Users CRUD own courses" ON public.courses;
CREATE POLICY "Users CRUD own courses" ON public.courses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- grading_weights
DROP POLICY IF EXISTS "Users CRUD own weights" ON public.grading_weights;
CREATE POLICY "Users CRUD own weights" ON public.grading_weights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- readings
DROP POLICY IF EXISTS "Users CRUD own readings" ON public.readings;
CREATE POLICY "Users CRUD own readings" ON public.readings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- resources
DROP POLICY IF EXISTS "Users CRUD own resources" ON public.resources;
CREATE POLICY "Users CRUD own resources" ON public.resources FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- study_roadmap
DROP POLICY IF EXISTS "Users CRUD own roadmap" ON public.study_roadmap;
CREATE POLICY "Users CRUD own roadmap" ON public.study_roadmap FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- study_sessions
DROP POLICY IF EXISTS "Users CRUD own sessions" ON public.study_sessions;
CREATE POLICY "Users CRUD own sessions" ON public.study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- syllabus_dates
DROP POLICY IF EXISTS "Users CRUD own dates" ON public.syllabus_dates;
CREATE POLICY "Users CRUD own dates" ON public.syllabus_dates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- syllabus_items
DROP POLICY IF EXISTS "Users CRUD own syllabus items" ON public.syllabus_items;
CREATE POLICY "Users CRUD own syllabus items" ON public.syllabus_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);