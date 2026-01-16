-- 1. Create specific ENUM types for statuses to ensure data integrity
create type content_status as enum ('draft', 'pending', 'approved', 'rejected');

-- 2. Update 'jobs' table
-- Add status column with default 'pending' (requires approval)
alter table jobs 
add column if not exists status content_status default 'pending';

-- Add admin_feedback column for rejection reasons (message to user)
alter table jobs
add column if not exists admin_feedback text;


-- 3. Update 'profiles' table for Video Pitch features
-- Add status column for the video approval
alter table profiles
add column if not exists video_url text,
add column if not exists video_status content_status default 'draft', -- draft until upload complete
add column if not exists is_admin boolean default false; -- Simple admin flag

-- 4. Enable Row Level Security (RLS) - This is CRITICAL
-- (Assuming RLS is receiving attention, we ensure policies exist)

-- Policy: Public can ONLY view APPROVED jobs
create policy "Public can view approved jobs"
on jobs for select
using (status = 'approved');

-- Policy: Creators can view their OWN jobs regardless of status
create policy "Users can view own jobs"
on jobs for select
using (auth.uid() = creator_id);

-- Policy: Admins can view ALL jobs
create policy "Admins can view all jobs"
on jobs for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);

-- Policy: Admins can update jobs (to approve/reject)
create policy "Admins can update jobs"
on jobs for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);
