-- Wayfarer: run this whole file once in a NEW Supabase project's SQL Editor (schema.sql + share.sql).

-- Run this in the Supabase SQL editor.
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  budget numeric not null,
  currency text not null default 'INR',
  preferences jsonb not null,
  itinerary jsonb not null,
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_user_idx on public.trips (user_id, created_at desc);

alter table public.trips enable row level security;

create policy "Users read own trips" on public.trips
  for select using (auth.uid() = user_id);
create policy "Users insert own trips" on public.trips
  for insert with check (auth.uid() = user_id);
create policy "Users update own trips" on public.trips
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own trips" on public.trips
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trips_updated_at on public.trips;
create trigger trips_updated_at before update on public.trips
  for each row execute function public.set_updated_at();

-- Run this in the Supabase SQL editor (after schema.sql) to enable read-only share links.
alter table public.trips add column if not exists share_token uuid;
create unique index if not exists trips_share_token_idx on public.trips (share_token) where share_token is not null;

-- Anyone holding the secret token can read that one trip (and nothing else).
create or replace function public.get_shared_trip(p_token uuid)
returns table (
  title text, destination text, start_date date, end_date date,
  budget numeric, currency text, preferences jsonb, itinerary jsonb, cover_image text
)
language sql
security definer
set search_path = public
as $$
  select title, destination, start_date, end_date, budget, currency, preferences, itinerary, cover_image
  from public.trips
  where share_token = p_token;
$$;

grant execute on function public.get_shared_trip(uuid) to anon, authenticated;
