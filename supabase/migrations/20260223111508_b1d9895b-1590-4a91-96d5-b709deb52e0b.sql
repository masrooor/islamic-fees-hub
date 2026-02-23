
CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view classes"
ON public.classes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage classes"
ON public.classes FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Seed with existing class grades
INSERT INTO public.classes (name, sort_order) VALUES
('Grade 1', 1), ('Grade 2', 2), ('Grade 3', 3), ('Grade 4', 4), ('Grade 5', 5),
('Grade 6', 6), ('Grade 7', 7), ('Grade 8', 8), ('Grade 9', 9), ('Grade 10', 10),
('Hifz Program', 11), ('Alim Course', 12);
