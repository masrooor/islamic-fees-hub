
ALTER TABLE public.payments ADD COLUMN collected_by uuid REFERENCES auth.users(id);
ALTER TABLE public.payments ADD COLUMN payment_mode text NOT NULL DEFAULT 'cash';
