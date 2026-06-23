-- Add language preference to profiles
alter table public.profiles
  add column if not exists lang text not null default 'pt' check (lang in ('pt','en'));
