
-- Add payment_mode and receipt_url columns to teacher_salaries
ALTER TABLE public.teacher_salaries
  ADD COLUMN payment_mode text NOT NULL DEFAULT 'cash',
  ADD COLUMN receipt_url text NOT NULL DEFAULT '';

-- Add custom_amount column for custom salary overrides
ALTER TABLE public.teacher_salaries
  ADD COLUMN custom_amount numeric NOT NULL DEFAULT 0;
