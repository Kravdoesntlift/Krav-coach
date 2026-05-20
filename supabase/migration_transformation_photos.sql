-- Coach transformation before/after photos
-- Run in Supabase SQL Editor

alter table profiles
  add column if not exists transformation_before_url text,
  add column if not exists transformation_after_url  text;
