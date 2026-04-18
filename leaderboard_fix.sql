-- ============================================================
--  Leaderboard Fix
--  Run in Supabase SQL Editor
-- ============================================================

-- 1. Allow authenticated users to read all profiles (needed for leaderboard)
--    Uses DO block so it's safe to run multiple times.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles'
      and policyname = 'Authenticated users can view all profiles.'
  ) then
    execute '
      create policy "Authenticated users can view all profiles."
        on public.profiles for select
        to authenticated
        using ( true )
    ';
  end if;
end $$;


-- 2. Recalculate total_points for ALL users from their quiz_results
--    (fixes any existing scores that weren't counted because the trigger
--     wasn't in place when those quizzes were taken)
update public.profiles p
set total_points = (
  select coalesce(sum(qr.points_earned), 0)
  from public.quiz_results qr
  where qr.user_id = p.id
);


-- 3. Verify — should show your users with points > 0
select id, full_name, total_points
from public.profiles
order by total_points desc
limit 20;
