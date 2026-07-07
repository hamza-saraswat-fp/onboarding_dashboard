-- Supabase Storage bucket for logos and CSV uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wizard-uploads',
  'wizard-uploads',
  false,
  5242880,  -- 5MB
  array['image/png','image/jpeg','image/webp','image/svg+xml','text/csv']
);

-- RLS on storage objects
create policy "Company can upload to own folder"
  on storage.objects for insert
  with check (bucket_id = 'wizard-uploads' and auth.jwt()->>'company_id' is not null);

create policy "Company can read own uploads"
  on storage.objects for select
  using (bucket_id = 'wizard-uploads' and auth.jwt()->>'company_id' is not null);
