
-- Create teacher_advances table for tracking advance salary payments
CREATE TABLE public.teacher_advances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- yyyy-MM format, the month this advance is for
  amount NUMERIC NOT NULL DEFAULT 0,
  date_given DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_advances ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins full access teacher_advances"
  ON public.teacher_advances FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Managers can view
CREATE POLICY "Managers can view teacher_advances"
  ON public.teacher_advances FOR SELECT
  USING (has_role(auth.uid(), 'manager'::app_role));

-- Authenticated users can access (same pattern as other tables)
CREATE POLICY "Authenticated users can access teacher_advances"
  ON public.teacher_advances FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
