-- ============================================================
--  CogniStruct – Quiz & Leaderboard Script
--  Run this in the Supabase SQL editor AFTER old_script.sql
-- ============================================================

-- 1. ── Quiz Results Table ─────────────────────────────────────────────────────
create table if not exists public.quiz_results (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  chapter_id    text not null,
  chapter_title text not null,
  quiz_type     text not null check (quiz_type in ('MCQ', 'FIB', 'MATCH', 'MIXED')),
  score         integer not null,          -- correct answers
  total         integer not null,          -- total questions (5)
  points_earned integer not null default 0,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_quiz_results_user
  on public.quiz_results (user_id, created_at desc);

alter table public.quiz_results enable row level security;

create policy "Users can view own quiz results."
  on public.quiz_results for select
  using ( auth.uid() = user_id );

create policy "Users can insert own quiz results."
  on public.quiz_results for insert
  with check ( auth.uid() = user_id );


-- 2. ── Add total_points to profiles ──────────────────────────────────────────
alter table public.profiles
  add column if not exists total_points integer not null default 0;

-- Index for leaderboard query
create index if not exists idx_profiles_points
  on public.profiles (total_points desc);


-- 3. ── Trigger: update total_points after every quiz submission ───────────────
create or replace function public.update_profile_total_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set total_points = (
    select coalesce(sum(points_earned), 0)
    from public.quiz_results
    where user_id = NEW.user_id
  )
  where id = NEW.user_id;
  return NEW;
end;
$$;

drop trigger if exists sync_points_on_quiz on public.quiz_results;
create trigger sync_points_on_quiz
  after insert on public.quiz_results
  for each row
  execute function public.update_profile_total_points();


-- 4. ── Leaderboard: profiles are already public (existing policy) ─────────────
-- The existing "Public profiles are viewable by everyone." policy on profiles
-- allows the leaderboard query to work without changes.
-- total_points column is now included in the select *.
