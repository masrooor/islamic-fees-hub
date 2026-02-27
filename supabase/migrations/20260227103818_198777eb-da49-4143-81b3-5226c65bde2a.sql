
-- Add proof_image_url column to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS proof_image_url TEXT NOT NULL DEFAULT '';

-- Add proof_image_url column to teacher_salaries table
ALTER TABLE public.teacher_salaries ADD COLUMN IF NOT EXISTS proof_image_url TEXT NOT NULL DEFAULT '';

-- Add proof_image_url column to teacher_advances table
ALTER TABLE public.teacher_advances ADD COLUMN IF NOT EXISTS proof_image_url TEXT NOT NULL DEFAULT '';

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment-proofs bucket
CREATE POLICY "Public can view payment proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated users can upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update payment proofs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete payment proofs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);
