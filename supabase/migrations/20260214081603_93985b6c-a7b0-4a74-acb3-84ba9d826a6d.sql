
-- Add student_code column with unique constraint
ALTER TABLE public.students ADD COLUMN student_code TEXT NOT NULL DEFAULT '';

-- Generate codes for existing students
UPDATE public.students SET student_code = 'STU-' || UPPER(SUBSTR(id::text, 1, 6)) WHERE student_code = '';

-- Add unique constraint
ALTER TABLE public.students ADD CONSTRAINT students_student_code_unique UNIQUE (student_code);

-- Create a function to auto-generate student codes on insert
CREATE OR REPLACE FUNCTION public.generate_student_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_code IS NULL OR NEW.student_code = '' THEN
    NEW.student_code := 'STU-' || UPPER(SUBSTR(gen_random_uuid()::text, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_generate_student_code
BEFORE INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.generate_student_code();
