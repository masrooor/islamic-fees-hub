
-- Create storage bucket for salary receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('salary-receipts', 'salary-receipts', true);

-- Allow authenticated users to upload receipts
CREATE POLICY "Authenticated users can upload salary receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'salary-receipts' AND auth.role() = 'authenticated');

-- Allow public read access to receipts
CREATE POLICY "Salary receipts are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'salary-receipts');
