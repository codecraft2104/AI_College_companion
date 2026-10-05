-- Keep academic files private. The client receives short-lived signed URLs
-- only after the owning row has passed its RLS check.
update storage.buckets
   set public = false
 where id = 'study-materials';

alter table public.study_materials enable row level security;

drop policy if exists "Users can read their own study materials" on public.study_materials;
create policy "Users can read their own study materials"
  on public.study_materials
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own study materials" on public.study_materials;
create policy "Users can create their own study materials"
  on public.study_materials
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own study materials" on public.study_materials;
create policy "Users can delete their own study materials"
  on public.study_materials
  for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can upload their own study files" on storage.objects;
create policy "Users can upload their own study files"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can read their own study files" on storage.objects;
create policy "Users can read their own study files"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete their own study files" on storage.objects;
create policy "Users can delete their own study files"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
