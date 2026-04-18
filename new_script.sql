-- ============================================================
--  CogniStruct – New Supabase Script
--  Run this in the Supabase SQL editor.
--  It is safe to run on top of the old_script.sql tables.
-- ============================================================

-- 1. ── Chapter Explanations Table ────────────────────────────────────────────
create table if not exists public.chapter_explanations (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  chapter_id    text not null,
  chapter_title text not null,
  content       text not null,
  length        text not null check (length in ('SHORT', 'STANDARD', 'LONG')),
  depth         text not null check (depth in ('BASIC', 'INTERMEDIATE', 'ADVANCED')),
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast per-user-per-chapter lookups
create index if not exists idx_explanations_user_chapter
  on public.chapter_explanations (user_id, chapter_id, created_at desc);

-- Row Level Security
alter table public.chapter_explanations enable row level security;

-- Users can only read their own explanations
create policy "Users can view own explanations."
  on public.chapter_explanations for select
  using ( auth.uid() = user_id );

-- Users can only insert their own explanations
create policy "Users can insert own explanations."
  on public.chapter_explanations for insert
  with check ( auth.uid() = user_id );

-- Users can delete their own explanations (for history management)
create policy "Users can delete own explanations."
  on public.chapter_explanations for delete
  using ( auth.uid() = user_id );


-- 2. ── Trigger: keep only 5 most recent explanations per user per chapter ────
create or replace function public.limit_chapter_explanations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Delete the oldest rows beyond the 5-record limit for this user+chapter
  delete from public.chapter_explanations
  where id in (
    select id
    from public.chapter_explanations
    where user_id = NEW.user_id
      and chapter_id = NEW.chapter_id
    order by created_at desc
    offset 5
  );
  return NEW;
end;
$$;

drop trigger if exists enforce_explanation_limit on public.chapter_explanations;
create trigger enforce_explanation_limit
  after insert on public.chapter_explanations
  for each row
  execute function public.limit_chapter_explanations();


-- 3. ── Harden existing RLS policies ─────────────────────────────────────────

-- user_data: add delete policy (prevents orphaned data)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_data' and policyname = 'Users can delete own user data.'
  ) then
    execute 'create policy "Users can delete own user data."
      on public.user_data for delete
      using ( auth.uid() = user_id )';
  end if;
end $$;

-- chat_history: add delete policy
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'chat_history' and policyname = 'Users can delete own chat history.'
  ) then
    execute 'create policy "Users can delete own chat history."
      on public.chat_history for delete
      using ( auth.uid() = user_id )';
  end if;
end $$;

-- profiles: tighten select to only expose non-sensitive columns
-- (the existing "Public profiles are viewable by everyone." is fine for community,
--  but ensure the hobbies column cannot be accessed by other users)
-- If you want to hide hobbies from other users, replace the blanket policy:
-- drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
-- create policy "Public profile fields are viewable by authenticated users."
--   on public.profiles for select to authenticated
--   using ( true );
-- NOTE: uncomment the two lines above if you want to restrict profile visibility
-- to authenticated users only (recommended).


-- 4. ── Add hobbies column to profiles if not already present ─────────────────
alter table public.profiles
  add column if not exists hobbies text;


-- 5. ── Enable Realtime for explanations ──────────────────────────────────────
-- (Only if not already added)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'chapter_explanations'
  ) then
    alter publication supabase_realtime add table public.chapter_explanations;
  end if;
end $$;
