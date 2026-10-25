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
