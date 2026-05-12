alter table public.profiles add column if not exists welcomed_at timestamptz;
alter table public.profiles add column if not exists seen_achievements text[] default '{}';
