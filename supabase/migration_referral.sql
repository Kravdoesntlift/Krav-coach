-- Referral system
-- Each client gets one unique code; referrals track signups & rewards

create table if not exists referral_codes (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references profiles(id) on delete cascade,
  code       text not null unique,
  created_at timestamptz default now(),
  constraint referral_codes_client_unique unique (client_id)
);

create table if not exists referrals (
  id               uuid primary key default gen_random_uuid(),
  referrer_id      uuid not null references profiles(id) on delete cascade,
  referred_email   text,
  referred_user_id uuid references profiles(id) on delete set null,
  status           text not null default 'pending' check (status in ('pending','signed_up','active')),
  bonus_granted    boolean not null default false,
  created_at       timestamptz default now()
);

-- Indexes
create index if not exists referral_codes_code_idx    on referral_codes (code);
create index if not exists referrals_referrer_idx      on referrals (referrer_id);
create index if not exists referrals_referred_user_idx on referrals (referred_user_id);

-- RLS
alter table referral_codes enable row level security;
alter table referrals       enable row level security;

-- Clients can read their own code
create policy "client read own code"
  on referral_codes for select
  using (client_id = auth.uid());

-- Server (admin) handles inserts — clients cannot insert
-- But clients can read their own referrals
create policy "client read own referrals"
  on referrals for select
  using (referrer_id = auth.uid());

-- Coaches can read referrals for their clients
create policy "coach read client referrals"
  on referrals for select
  using (
    exists (
      select 1 from workout_plans wp
      where wp.coach_id = auth.uid()
        and wp.client_id = referrals.referrer_id
    )
  );
