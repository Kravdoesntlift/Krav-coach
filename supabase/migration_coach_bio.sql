-- Coach bio & credentials fields
-- Run in Supabase SQL Editor

alter table profiles
  add column if not exists bio              text,
  add column if not exists bio_en           text,
  add column if not exists years_experience int,
  add column if not exists credentials      text[] default '{}';
