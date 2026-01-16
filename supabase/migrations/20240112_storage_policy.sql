-- Create a new storage bucket for videos
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- Set up security policies for the 'videos' bucket
create policy "Public Videos are viewable by everyone"
  on storage.objects for select
  using ( bucket_id = 'videos' );

create policy "Users can upload their own videos"
  on storage.objects for insert
  with check (
    bucket_id = 'videos' and
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

create policy "Users can update their own videos"
  on storage.objects for update
  using (
    bucket_id = 'videos' and
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

create policy "Users can delete their own videos"
  on storage.objects for delete
  using (
    bucket_id = 'videos' and
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
