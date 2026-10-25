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
