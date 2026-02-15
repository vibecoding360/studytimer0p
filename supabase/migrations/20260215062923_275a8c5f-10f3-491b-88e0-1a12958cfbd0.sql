
-- Fix: recreate view with security_invoker to respect RLS of the querying user
CREATE OR REPLACE VIEW public.course_current_grades
WITH (security_invoker = true) AS
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
