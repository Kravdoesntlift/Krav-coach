-- Add slug to profiles for clean public URLs
-- Run in Supabase SQL Editor

alter table public.profiles
  add column if not exists slug text unique;

-- Index for fast slug lookups
create index if not exists profiles_slug_idx on public.profiles (slug);

-- Helper: generate a URL-safe slug from a name
create or replace function public.slugify(input text)
returns text language plpgsql immutable as $$
begin
  return lower(
    regexp_replace(
      regexp_replace(
        translate(
          regexp_replace(trim(input), '[^a-zA-Z0-9\s\-]', '', 'g'),
          ' ', '-'
        ),
        '-{2,}', '-', 'g'
      ),
      '(^-|-$)', '', 'g'
    )
  );
end;
$$;
