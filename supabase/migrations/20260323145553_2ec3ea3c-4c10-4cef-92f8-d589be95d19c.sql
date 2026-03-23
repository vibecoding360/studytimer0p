
CREATE TABLE public.daily_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, completed_date)
);

ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completions"
  ON public.daily_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON public.daily_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
