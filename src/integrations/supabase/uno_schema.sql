-- Create tables for Uno Game

-- 1. Rooms Table
create table public.uno_rooms (
  id uuid default gen_random_uuid() primary key,
  code text not null,
  host_id uuid references auth.users(id),
  status text default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  settings jsonb default '{"starting_cards": 7, "deck_size": 108}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Game States Table
create table public.uno_game_states (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.uno_rooms(id) on delete cascade unique,
  current_player_index integer default 0,
  direction integer default 1, -- 1 or -1
  deck jsonb[] default array[]::jsonb[],
  discard_pile jsonb[] default array[]::jsonb[],
  players jsonb[] default array[]::jsonb[], -- Array of {id, name, hand, is_ready}
  winner_id uuid,
  version integer default 0, -- For optimistic concurrency
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.uno_rooms enable row level security;
alter table public.uno_game_states enable row level security;

-- 4. Policies (Open for now for simplicity, refine for production)
create policy "Enable all access for authenticated users" 
on public.uno_rooms for all 
using (auth.role() = 'authenticated') 
with check (auth.role() = 'authenticated');

create policy "Enable all access for authenticated users" 
on public.uno_game_states for all 
using (auth.role() = 'authenticated') 
with check (auth.role() = 'authenticated');

-- 5. Realtime
alter publication supabase_realtime add table public.uno_rooms;
alter publication supabase_realtime add table public.uno_game_states;
