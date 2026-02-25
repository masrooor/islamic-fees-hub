-- =============================================
-- Database Schema Export
-- Project: Islamic Fees Hub
-- Generated: 2026-02-25
-- =============================================

-- ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'manager');

-- =============================================
-- TABLES
-- =============================================

-- Classes
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Students
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  guardian_name TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  class_grade TEXT NOT NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Fee Structures
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_grade TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

-- Payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  fee_type TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  fee_month TEXT NOT NULL DEFAULT '',
  receipt_number TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  collected_by UUID NULL,
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  receipt_printed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Teachers
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  cnic TEXT NOT NULL DEFAULT '',
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  monthly_salary NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Teacher Attendance
CREATE TABLE public.teacher_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_in TIME WITHOUT TIME ZONE NULL,
  time_out TIME WITHOUT TIME ZONE NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Teacher Loans
CREATE TABLE public.teacher_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  remaining NUMERIC NOT NULL DEFAULT 0,
  date_issued DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  repayment_type TEXT NOT NULL DEFAULT 'manual',
  repayment_month TEXT NULL,
  repayment_percentage NUMERIC NULL,
  repayment_amount NUMERIC NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.teacher_loans ENABLE ROW LEVEL SECURITY;

-- Teacher Salaries
CREATE TABLE public.teacher_salaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  month TEXT NOT NULL,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  loan_deduction NUMERIC NOT NULL DEFAULT 0,
  other_deduction NUMERIC NOT NULL DEFAULT 0,
  net_paid NUMERIC NOT NULL DEFAULT 0,
  date_paid DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT NOT NULL DEFAULT '',
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  receipt_url TEXT NOT NULL DEFAULT '',
  custom_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.teacher_salaries ENABLE ROW LEVEL SECURITY;

-- User Roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user'
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FOREIGN KEYS
-- =============================================

ALTER TABLE public.payments
  ADD CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);

ALTER TABLE public.teacher_attendance
  ADD CONSTRAINT teacher_attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id);

ALTER TABLE public.teacher_loans
  ADD CONSTRAINT teacher_loans_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id);

ALTER TABLE public.teacher_salaries
  ADD CONSTRAINT teacher_salaries_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id);

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_student_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.student_code IS NULL OR NEW.student_code = '' THEN
    NEW.student_code := 'STU-' || UPPER(SUBSTR(gen_random_uuid()::text, 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Classes
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated users can view classes" ON public.classes FOR SELECT USING (auth.uid() IS NOT NULL);

-- Students
CREATE POLICY "Admins full access students" ON public.students FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated users can access students" ON public.students FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Fee Structures
CREATE POLICY "Admins full access fee_structures" ON public.fee_structures FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated users can access fee_structures" ON public.fee_structures FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Payments
CREATE POLICY "Admins full access payments" ON public.payments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated users can access payments" ON public.payments FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Teachers
CREATE POLICY "Admins full access teachers" ON public.teachers FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Managers can view teachers" ON public.teachers FOR SELECT USING (has_role(auth.uid(), 'manager'));

-- Teacher Attendance
CREATE POLICY "Admins full access teacher_attendance" ON public.teacher_attendance FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Managers can view teacher_attendance" ON public.teacher_attendance FOR SELECT USING (has_role(auth.uid(), 'manager'));

-- Teacher Loans
CREATE POLICY "Admins full access teacher_loans" ON public.teacher_loans FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Managers can view teacher_loans" ON public.teacher_loans FOR SELECT USING (has_role(auth.uid(), 'manager'));

-- Teacher Salaries
CREATE POLICY "Admins full access teacher_salaries" ON public.teacher_salaries FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Managers can view teacher_salaries" ON public.teacher_salaries FOR SELECT USING (has_role(auth.uid(), 'manager'));

-- User Roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Managers can view roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('salary-receipts', 'salary-receipts', true);
