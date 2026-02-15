
-- Study sessions table for Deep Work timer
CREATE TABLE public.study_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  syllabus_item_id uuid REFERENCES public.syllabus_items(id) ON DELETE SET NULL,
  mode text NOT NULL DEFAULT 'pomodoro',
  duration_minutes integer NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  focus_score integer CHECK (focus_score BETWEEN 1 AND 5),
  commit_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own sessions"
ON public.study_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_study_sessions_user_date ON public.study_sessions(user_id, completed_at);
CREATE INDEX idx_study_sessions_course ON public.study_sessions(course_id);
