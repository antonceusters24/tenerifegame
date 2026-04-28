-- Migration v2: PIN change, peer confirmation, test challenges
-- Run this in the Supabase SQL Editor AFTER the initial schema

-- 1. Add pin_changed flag to users
alter table users add column pin_changed boolean default false;

-- 2. Update assignment status to include 'pending' for peer confirmation
alter table assignments drop constraint if exists assignments_status_check;
alter table assignments add constraint assignments_status_check
  check (status in ('active', 'pending', 'completed', 'skipped'));

-- 3. Confirmations table (peer evaluation)
create table confirmations (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references assignments(id) on delete cascade,
  confirmed_by uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(assignment_id, confirmed_by)
);

alter table confirmations enable row level security;
create policy "Allow all" on confirmations for all using (true) with check (true);

-- 4. Update scoreboard view (pending doesn't count, add pending_count)
create or replace view scoreboard as
select
  u.id as user_id,
  u.name,
  coalesce(sum(case when a.status = 'completed' then c.points else 0 end), 0) as earned_points,
  coalesce(sum(case when a.status = 'skipped' then -10 else 0 end), 0) as penalty_points,
  coalesce(sum(case when a.status = 'completed' then c.points else 0 end), 0)
    + coalesce(sum(case when a.status = 'skipped' then -10 else 0 end), 0) as total_points,
  count(case when a.status = 'completed' then 1 end) as completed_count,
  count(case when a.status = 'skipped' then 1 end) as skipped_count,
  count(case when a.status = 'pending' then 1 end) as pending_count
from users u
left join assignments a on a.user_id = u.id
left join challenges c on c.id = a.challenge_id
where u.role = 'player'
group by u.id, u.name
order by total_points desc;

-- 5. Seed 2 test challenges
insert into challenges (category_id, title, description, difficulty, points) values
  (
    (select id from categories where name = 'Gotcha'),
    'Secret Word Master',
    'Your secret words are: "sunburn", "cocktail", "towel". Trick the other lads into saying these words in normal conversation. Each word caught = bragging rights!',
    'medium',
    10
  ),
  (
    (select id from categories where name = 'Photo Mission'),
    'Tourist Impersonator',
    'Take a selfie with a complete stranger while both doing the exact same ridiculous pose. Must be an actual stranger, not one of the lads!',
    'easy',
    5
  );
