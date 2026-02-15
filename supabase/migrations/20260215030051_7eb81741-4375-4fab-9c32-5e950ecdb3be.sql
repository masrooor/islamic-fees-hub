
-- Teachers table
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text NOT NULL DEFAULT '',
  cnic text NOT NULL DEFAULT '',
  joining_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active',
  monthly_salary numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access teachers" ON public.teachers FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Managers can view teachers" ON public.teachers FOR SELECT
  USING (has_role(auth.uid(), 'manager'));

-- Teacher loans
CREATE TABLE public.teacher_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  remaining numeric NOT NULL DEFAULT 0,
  date_issued date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teacher_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access teacher_loans" ON public.teacher_loans FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Managers can view teacher_loans" ON public.teacher_loans FOR SELECT
  USING (has_role(auth.uid(), 'manager'));

-- Teacher salary payments
CREATE TABLE public.teacher_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  month text NOT NULL,
  base_salary numeric NOT NULL DEFAULT 0,
  loan_deduction numeric NOT NULL DEFAULT 0,
  other_deduction numeric NOT NULL DEFAULT 0,
  net_paid numeric NOT NULL DEFAULT 0,
  date_paid date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teacher_salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access teacher_salaries" ON public.teacher_salaries FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Managers can view teacher_salaries" ON public.teacher_salaries FOR SELECT
  USING (has_role(auth.uid(), 'manager'));

-- Teacher attendance
CREATE TABLE public.teacher_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  time_in time,
  time_out time,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, date)
);
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access teacher_attendance" ON public.teacher_attendance FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Managers can view teacher_attendance" ON public.teacher_attendance FOR SELECT
  USING (has_role(auth.uid(), 'manager'));

-- Allow managers to view roles
CREATE POLICY "Managers can view roles" ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'manager'));
