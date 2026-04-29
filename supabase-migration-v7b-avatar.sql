-- Add avatar_url column to users table
alter table users add column if not exists avatar_url text;

-- Create avatars storage bucket (public)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow authenticated uploads to avatars bucket
create policy "Anyone can upload avatars" on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Anyone can read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can update avatars" on storage.objects
  for update using (bucket_id = 'avatars');
