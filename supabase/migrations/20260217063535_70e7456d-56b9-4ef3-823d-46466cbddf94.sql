
-- Add repayment configuration columns to teacher_loans
ALTER TABLE public.teacher_loans
ADD COLUMN repayment_type text NOT NULL DEFAULT 'manual',
ADD COLUMN repayment_month text DEFAULT NULL,
ADD COLUMN repayment_percentage numeric DEFAULT NULL,
ADD COLUMN repayment_amount numeric DEFAULT NULL;

-- repayment_type: 'specific_month' | 'percentage' | 'custom_amount' | 'manual'
-- repayment_month: target month for full return (YYYY-MM)
-- repayment_percentage: % of salary to deduct monthly
-- repayment_amount: fixed amount to deduct monthly
