-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy: Applicants can insert their own applications
CREATE POLICY "Applicants can insert their own applications" 
ON applications FOR INSERT 
WITH CHECK (auth.uid() = applicant_id);

-- Policy: Job creators can view applications for their jobs
CREATE POLICY "Job creators can view applications for their jobs" 
ON applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = applications.job_id 
    AND jobs.creator_id = auth.uid()
  )
);

-- Policy: Applicants can view their own applications (optional, but good for UX)
CREATE POLICY "Applicants can view their own applications" 
ON applications FOR SELECT 
USING (auth.uid() = applicant_id);
