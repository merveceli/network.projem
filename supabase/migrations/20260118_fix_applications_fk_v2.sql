-- Drop the specific constraint causing the error
alter table "public"."applications" drop constraint if exists "applications_applicant_id_profiles_fkey";

-- Drop the other likely named constraint just in case to avoid duplicates
alter table "public"."applications" drop constraint if exists "applications_applicant_id_fkey";

-- Re-add the constraint with proper Cascade
alter table "public"."applications"
add constraint "applications_applicant_id_fkey"
foreign key (applicant_id)
references profiles(id)
on delete cascade;

-- Also ensure job_id triggers cascade if a job is deleted (though jobs cascade from user, so this is doubly safe)
alter table "public"."applications" drop constraint if exists "applications_job_id_fkey";
alter table "public"."applications" 
add constraint "applications_job_id_fkey"
foreign key (job_id) 
references jobs(id)
on delete cascade;
