-- Add workout columns to daily_health_logs for Apple Health workout sync
-- Run in Supabase SQL Editor

alter table public.daily_health_logs
  add column if not exists workout_minutes  integer check (workout_minutes >= 0),
  add column if not exists active_calories  integer check (active_calories >= 0);
