alter table "public"."jobs" drop constraint "jobs_creator_id_fkey";

alter table "public"."jobs"
add constraint "jobs_creator_id_fkey"
foreign key (creator_id)
references profiles(id)
on delete cascade;
