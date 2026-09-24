-- ============================================================
-- KRAV Coach: marcar alertas como tratados
-- Correr no SQL Editor do Supabase (uma vez)
-- ============================================================
--
-- Os alertas do dashboard são calculados, não guardados. Marcar um como
-- tratado não pode apagá-lo para sempre, senão um cliente que continua sem
-- check-in desaparece da vista e nunca mais volta.
--
-- Por isso cada marca guarda o CONTEXTO em que foi feita: a semana, ou a data
-- de renovação. Quando o contexto muda (semana nova, renovação nova), o alerta
-- reaparece sozinho. Uma marca por cliente, por tipo, por contexto.

create table if not exists public.coach_alert_acks (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  client_id  uuid not null references public.profiles(id) on delete cascade,
  alert_type text not null,
  context    text not null,
  created_at timestamptz not null default now(),
  unique (coach_id, client_id, alert_type, context)
);

create index if not exists idx_alert_acks_coach on public.coach_alert_acks (coach_id);

alter table public.coach_alert_acks enable row level security;

drop policy if exists "Coaches manage their own alert acks" on public.coach_alert_acks;
create policy "Coaches manage their own alert acks"
  on public.coach_alert_acks for all
  to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

grant select, insert, update, delete on public.coach_alert_acks to authenticated;
