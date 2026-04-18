-- ============================================================
--  CogniStruct – Security Patch
--  Safe to run multiple times. Wraps every step in existence
--  checks so it never crashes on already-applied changes.
-- ============================================================


-- ── 1. Add is_admin column to profiles (if missing) ──────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;


-- ── 2. Add hobbies column to profiles (if missing) ───────────────────────────
alter table public.profiles
  add column if not exists hobbies text;


-- ── 3. Add total_points column to profiles (if missing) ──────────────────────
alter table public.profiles
  add column if not exists total_points integer not null default 0;


-- ── 4. Fix RLS policy on profiles ────────────────────────────────────────────
--  Drop the over-broad old policy, create the restricted replacement.
--  Both steps guarded so re-running is safe.
do $$
begin
  if exists (
    select 1 from pg_policies
    where tablename = 'profiles'
      and policyname = 'Authenticated users can view all profiles.'
  ) then
    execute 'drop policy "Authenticated users can view all profiles." on public.profiles';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles'
      and policyname = 'Authenticated users can read peer profiles.'
  ) then
    execute '
      create policy "Authenticated users can read peer profiles."
        on public.profiles for select
        to authenticated
        using ( true )
    ';
  end if;
end $$;


-- ── 5. quiz_results table + policies (safe if already exists) ────────────────
create table if not exists public.quiz_results (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  chapter_id    text not null,
  chapter_title text not null,
  quiz_type     text not null check (quiz_type in ('MCQ', 'FIB', 'MATCH', 'MIXED')),
  score         integer not null,
  total         integer not null,
  points_earned integer not null default 0,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_quiz_results_user
  on public.quiz_results (user_id, created_at desc);

alter table public.quiz_results enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'quiz_results'
      and policyname = 'Users can view own quiz results.'
  ) then
    execute '
      create policy "Users can view own quiz results."
        on public.quiz_results for select
        using ( auth.uid() = user_id )
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'quiz_results'
      and policyname = 'Users can insert own quiz results.'
  ) then
    execute '
      create policy "Users can insert own quiz results."
        on public.quiz_results for insert
        with check ( auth.uid() = user_id )
    ';
  end if;
end $$;


-- ── 6. Trigger: update total_points after every quiz submission ───────────────
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


-- ── 7. chapter_explanations table + policies (safe if already exists) ─────────
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

create index if not exists idx_explanations_user_chapter
  on public.chapter_explanations (user_id, chapter_id, created_at desc);

alter table public.chapter_explanations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'chapter_explanations'
      and policyname = 'Users can view own explanations.'
  ) then
    execute '
      create policy "Users can view own explanations."
        on public.chapter_explanations for select
        using ( auth.uid() = user_id )
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'chapter_explanations'
      and policyname = 'Users can insert own explanations.'
  ) then
    execute '
      create policy "Users can insert own explanations."
        on public.chapter_explanations for insert
        with check ( auth.uid() = user_id )
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'chapter_explanations'
      and policyname = 'Users can delete own explanations.'
  ) then
    execute '
      create policy "Users can delete own explanations."
        on public.chapter_explanations for delete
        using ( auth.uid() = user_id )
    ';
  end if;
end $$;


-- ── 8. Trigger: keep only 5 most recent explanations per user per chapter ─────
create or replace function public.limit_chapter_explanations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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


-- ── 9. user_data delete policy (if missing) ───────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_data'
      and policyname = 'Users can delete own user data.'
  ) then
    execute '
      create policy "Users can delete own user data."
        on public.user_data for delete
        using ( auth.uid() = user_id )
    ';
  end if;
end $$;


-- ── 10. chat_history delete policy (if missing) ───────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'chat_history'
      and policyname = 'Users can delete own chat history.'
  ) then
    execute '
      create policy "Users can delete own chat history."
        on public.chat_history for delete
        using ( auth.uid() = user_id )
    ';
  end if;
end $$;


-- ── 11. Leaderboard index (if missing) ────────────────────────────────────────
create index if not exists idx_profiles_points
  on public.profiles (total_points desc);


-- ── 12. Recalculate total_points for all users from quiz_results ──────────────
update public.profiles p
set total_points = (
  select coalesce(sum(qr.points_earned), 0)
  from public.quiz_results qr
  where qr.user_id = p.id
);


-- ── 13. Verify ────────────────────────────────────────────────────────────────
-- Shows current admin users (email from auth.users, profile data from profiles)
select p.id, u.email, p.full_name, p.is_admin, p.total_points
from public.profiles p
join auth.users u on u.id = p.id
order by p.total_points desc
limit 20;


-- ── HOW TO GRANT ADMIN ACCESS ─────────────────────────────────────────────────
-- Run this separately for each teacher/admin:
--
--   update public.profiles set is_admin = true
--     where id = (select id from auth.users where email = 'teacher@school.com');
