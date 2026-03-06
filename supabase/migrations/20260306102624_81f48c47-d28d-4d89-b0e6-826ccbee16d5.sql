
CREATE TABLE public.teacher_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  date_given date NOT NULL DEFAULT CURRENT_DATE,
  month text NOT NULL,
  notes text NOT NULL DEFAULT '',
  payment_mode text NOT NULL DEFAULT 'cash',
  proof_image_url text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access teacher_bonuses" ON public.teacher_bonuses
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Managers can view teacher_bonuses" ON public.teacher_bonuses
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role));
