-- Add is_filled column to jobs table for marking jobs as filled
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS is_filled boolean DEFAULT false;

-- Add index for better query performance when filtering by filled status
CREATE INDEX IF NOT EXISTS idx_jobs_is_filled ON jobs(is_filled);

-- Add comment for documentation
COMMENT ON COLUMN jobs.is_filled IS 'Indicates whether the job position has been filled';
