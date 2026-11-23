-- Wanderstamp · Supabase schema
-- Run once in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run again (idempotent).

-- 1. One backup row per user: the whole museum passport as JSON.
create table if not exists public.museum_backups (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  payload    jsonb       not null,
  version    integer     not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.museum_backups enable row level security;

drop policy if exists "Users read own backup"   on public.museum_backups;
drop policy if exists "Users insert own backup" on public.museum_backups;
drop policy if exists "Users update own backup" on public.museum_backups;
drop policy if exists "Users delete own backup" on public.museum_backups;

create policy "Users read own backup"   on public.museum_backups for select using (auth.uid() = user_id);
create policy "Users insert own backup" on public.museum_backups for insert with check (auth.uid() = user_id);
create policy "Users update own backup" on public.museum_backups for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own backup" on public.museum_backups for delete using (auth.uid() = user_id);

-- 2. Storage bucket for photos and videos.
--    Public read (so images load fast with a plain URL); file names are random UUIDs.
--    Only the owner can upload / change / delete files inside their own folder: <user_id>/...
insert into storage.buckets (id, name, public, file_size_limit)
values ('museum-media', 'museum-media', true, 104857600) -- 100 MB per file
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "Users upload own media" on storage.objects;
drop policy if exists "Users update own media" on storage.objects;
drop policy if exists "Users delete own media" on storage.objects;

create policy "Users upload own media" on storage.objects for insert to authenticated
  with check (bucket_id = 'museum-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own media" on storage.objects for update to authenticated
  using (bucket_id = 'museum-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own media" on storage.objects for delete to authenticated
  using (bucket_id = 'museum-media' and (storage.foldername(name))[1] = auth.uid()::text);
