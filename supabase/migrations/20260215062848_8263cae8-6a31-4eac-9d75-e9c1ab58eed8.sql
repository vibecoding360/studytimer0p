
-- 1. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS university_name text,
  ADD COLUMN IF NOT EXISTS major text;

-- 2. Add credits column to courses (course_code = code, course_name = name already exist)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS credits integer;

-- 3. Create syllabus_items table
CREATE TABLE public.syllabus_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'Exam' CHECK (type IN ('Exam', 'Quiz', 'Project', 'Reading')),
  weight_percentage numeric NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo', 'In-Progress', 'Completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Add resource_link column to resources
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS resource_link text;

-- Update resource_type check: we can't add a CHECK easily on existing column, 
-- but the column already exists with default 'video'. We'll leave it flexible.

-- 5. Drop old foreign keys and re-add with CASCADE
ALTER TABLE public.syllabus_dates DROP CONSTRAINT IF EXISTS syllabus_dates_course_id_fkey;
ALTER TABLE public.syllabus_dates ADD CONSTRAINT syllabus_dates_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.grading_weights DROP CONSTRAINT IF EXISTS grading_weights_course_id_fkey;
ALTER TABLE public.grading_weights ADD CONSTRAINT grading_weights_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.readings DROP CONSTRAINT IF EXISTS readings_course_id_fkey;
ALTER TABLE public.readings ADD CONSTRAINT readings_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_course_id_fkey;
ALTER TABLE public.resources ADD CONSTRAINT resources_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.study_roadmap DROP CONSTRAINT IF EXISTS study_roadmap_course_id_fkey;
ALTER TABLE public.study_roadmap ADD CONSTRAINT study_roadmap_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Add FK for syllabus_items with CASCADE
ALTER TABLE public.syllabus_items ADD CONSTRAINT syllabus_items_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- 6. Enable RLS on syllabus_items
ALTER TABLE public.syllabus_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own syllabus items"
  ON public.syllabus_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Create view for current grade (sum of weights of completed items per course)
CREATE OR REPLACE VIEW public.course_current_grades AS
SELECT
  course_id,
  user_id,
  COALESCE(SUM(weight_percentage) FILTER (WHERE status = 'Completed'), 0) AS completed_weight,
  COALESCE(SUM(weight_percentage), 0) AS total_weight,
  CASE 
    WHEN SUM(weight_percentage) > 0 
    THEN ROUND((SUM(weight_percentage) FILTER (WHERE status = 'Completed') / SUM(weight_percentage)) * 100, 2)
    ELSE 0
  END AS current_grade_percentage
FROM public.syllabus_items
GROUP BY course_id, user_id;
