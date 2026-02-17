-- Allow users (all authenticated) to access student-related tables
CREATE POLICY "Authenticated users can access students"
ON public.students
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access payments"
ON public.payments
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access fee_structures"
ON public.fee_structures
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to read their own role
CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);
