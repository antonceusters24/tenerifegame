-- Run this in the Supabase SQL Editor to set up the database

-- Users table (simple login, no Supabase Auth needed)
create table users (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  pin text not null, -- simple 4-digit pin
  role text not null default 'player' check (role in ('player', 'admin')),
  created_at timestamptz default now()
);

-- Challenge categories
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Challenges pool (uploaded by admins)
create table challenges (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete cascade,
  title text not null,
  description text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  points integer not null default 10,
  created_at timestamptz default now()
);

-- Assigned challenges to players
create table assignments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  challenge_id uuid references challenges(id) on delete cascade,
  day integer not null check (day between 1 and 7),
  status text not null default 'active' check (status in ('active', 'completed', 'skipped')),
  assigned_at timestamptz default now(),
  completed_at timestamptz
);

-- Scoreboard view
create or replace view scoreboard as
select
  u.id as user_id,
  u.name,
  coalesce(sum(case when a.status = 'completed' then c.points else 0 end), 0) as earned_points,
  coalesce(sum(case when a.status = 'skipped' then -10 else 0 end), 0) as penalty_points,
  coalesce(sum(case when a.status = 'completed' then c.points else 0 end), 0)
    + coalesce(sum(case when a.status = 'skipped' then -10 else 0 end), 0) as total_points,
  count(case when a.status = 'completed' then 1 end) as completed_count,
  count(case when a.status = 'skipped' then 1 end) as skipped_count
from users u
left join assignments a on a.user_id = u.id
left join challenges c on c.id = a.challenge_id
where u.role = 'player'
group by u.id, u.name
order by total_points desc;

-- Seed: categories
insert into categories (name, description) values
  ('Gotcha', 'Get others to say your secret words'),
  ('Undercover Agent', 'Do something subtle all day without being caught'),
  ('Photo Mission', 'Complete a photo or video challenge'),
  ('Social Dare', 'Interact with strangers in a specific way'),
  ('The Actor', 'Stay in character for a set period'),
  ('Duel', 'Head-to-head challenge against another player'),
  ('Food & Drink Roulette', 'Food or drink related challenges'),
  ('The Bet', 'Make a prediction about the group or the day'),
  ('Outfit Penalty', 'Wear or carry something ridiculous'),
  ('Stealth Mission', 'Do something to another player without them noticing');

-- Seed: users (players + admins)
insert into users (name, pin, role) values
  ('Lander', '1234', 'player'),
  ('Berten', '1234', 'player'),
  ('Dries', '1234', 'player'),
  ('Anton', '1234', 'player'),
  ('Hanne', '0000', 'admin'),
  ('Klaas', '0000', 'admin');

-- Enable RLS
alter table users enable row level security;
alter table categories enable row level security;
alter table challenges enable row level security;
alter table assignments enable row level security;

-- Policies: allow all access (we handle auth in the app with service key)
-- Using anon key with permissive policies since this is a simple fun app
create policy "Allow all" on users for all using (true) with check (true);
create policy "Allow all" on categories for all using (true) with check (true);
create policy "Allow all" on challenges for all using (true) with check (true);
create policy "Allow all" on assignments for all using (true) with check (true);
