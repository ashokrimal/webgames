-- Enable Row Level Security
alter table users enable row level security;
alter table game_sessions enable row level security;
alter table game_stats enable row level security;
alter table achievements enable row level security;

-- Users table policies
create policy "Users can read their own data" on users
  for select using (auth.uid() = id);

create policy "Users can update their own data" on users
  for update using (auth.uid() = id);

-- Game sessions policies
create policy "Users can read sessions they're in" on game_sessions
  for select using (auth.uid()::text = any(players));

create policy "Users can create game sessions" on game_sessions
  for insert with check (auth.uid()::text = any(players));

create policy "Users can update sessions they're in" on game_sessions
  for update using (auth.uid()::text = any(players));

-- Game stats policies
create policy "Users can read their own stats" on game_stats
  for select using (auth.uid() = user_id);

create policy "Users can update their own stats" on game_stats
  for all using (auth.uid() = user_id);

-- Achievements policies
create policy "Users can read their own achievements" on achievements
  for select using (auth.uid() = user_id);

create policy "Users can update their own achievements" on achievements
  for all using (auth.uid() = user_id);

-- Functions for calculating user stats
create or replace function calculate_user_stats(user_uuid uuid)
returns table (
  total_games bigint,
  total_wins bigint,
  total_score bigint,
  avg_score numeric,
  win_rate numeric
)
language sql
as $$
  select
    count(*) as total_games,
    count(*) filter (where winner = user_uuid::text) as total_wins,
    sum(case when winner = user_uuid::text then 100 else 0 end) as total_score,
    avg(case when winner = user_uuid::text then 100.0 else 0.0 end) as avg_score,
    (count(*) filter (where winner = user_uuid::text)::numeric / nullif(count(*), 0)) * 100 as win_rate
  from game_sessions
  where user_uuid::text = any(players);
$$;

-- Function to update user level based on experience
create or replace function update_user_level()
returns trigger
language plpgsql
as $$
begin
  -- Calculate level based on experience (simple formula)
  new.level = floor(sqrt(new.experience / 100)) + 1;
  return new;
end;
$$;

-- Trigger to automatically update user level
create trigger update_user_level_trigger
  before update on users
  for each row
  execute function update_user_level();

-- Indexes for performance
create index idx_game_sessions_players on game_sessions using gin (players);
create index idx_game_sessions_created_at on game_sessions (created_at desc);
create index idx_game_stats_user_game on game_stats (user_id, game_type);
create index idx_achievements_user on achievements (user_id, achievement_type);
