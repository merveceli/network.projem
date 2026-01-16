-- Drop valid foreign key constraint to auth.users if exists
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_applicant_id_fkey;

-- Add foreign key constraint to profiles table
ALTER TABLE applications
ADD CONSTRAINT applications_applicant_id_fkey
FOREIGN KEY (applicant_id)
REFERENCES profiles(id)
ON DELETE CASCADE;
