-- Add job_type and salary_range columns to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS job_type text DEFAULT 'Tam Zamanlı',
ADD COLUMN IF NOT EXISTS salary_range text;

-- Add check constraint for job_type to ensure valid values
ALTER TABLE jobs
ADD CONSTRAINT job_type_check CHECK (job_type IN ('Tam Zamanlı', 'Yarı Zamanlı', 'Proje Bazlı', 'Stajyer'));
