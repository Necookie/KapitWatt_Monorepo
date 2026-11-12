-- KapitWatt initial schema. Plain Postgres so it runs on Neon or Supabase unchanged.
-- Mirrors the data model in the plan (section 6) and the Zod entities in
-- packages/shared/src/schemas/entities.ts. Keep the two in sync.
--
-- Columns marked [+] are not in the plan's diagram but are needed by a rule in the plan.

create extension if not exists pgcrypto;

create table barangays (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  municipality  text not null,
  feeder_id     text,
  unique (municipality, name)
);

create table households (
  id                  uuid primary key default gen_random_uuid(),
  barangay_id         uuid not null references barangays (id),
  auth_token_hash     text unique,                       -- [+] simple token auth for the demo
  push_token          text,
  meter_type          text not null check (meter_type in ('ami', 'standard')),
  meter_serial        text not null,
  bill_avg_kwh_month  numeric(10, 2) not null check (bill_avg_kwh_month > 0),
  baseline_kw         numeric(8, 3),                     -- null until rehearsal (photo) or AMI history
  trust_score         numeric(6, 2) not null default 50, -- P1; starts neutral
  opted_in            boolean not null default false,    -- [+] only opted-in households get alerts
  consent_at          timestamptz,                       -- [+] Data Privacy Act 2012 consent
  lat                 double precision,                  -- [+] registered address, for the GPS check
  lng                 double precision,
  is_simulated        boolean not null default false,
  created_at          timestamptz not null default now()
);
create index households_barangay_idx on households (barangay_id);
create index households_simulated_idx on households (is_simulated) where is_simulated;

create table appliances (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households (id) on delete cascade,
  type          text not null,
  rated_kw      numeric(6, 3) not null check (rated_kw > 0)
);

create table alerts (
  id                   uuid primary key default gen_random_uuid(),
  level                text not null check (level in ('yellow', 'red')),
  window_start         timestamptz not null,
  window_end           timestamptz not null,
  target_kw            numeric(10, 2) not null check (target_kw > 0),
  target_barangay_ids  uuid[] not null default '{}',
  message              text not null,                    -- [+] what was sent
  status               text not null default 'active'
    check (status in ('scheduled', 'active', 'window_open', 'settling', 'settled', 'cancelled')),
  created_by           text not null,                    -- [+] every alert is logged with sender and time
  created_at           timestamptz not null default now(),
  check (window_end > window_start)
);

create table commitments (
  id            uuid primary key default gen_random_uuid(),
  alert_id      uuid not null references alerts (id) on delete cascade,
  household_id  uuid not null references households (id) on delete cascade,
  committed_kw  numeric(6, 2) not null check (committed_kw > 0),
  path          text not null check (path in ('ami', 'photo')),
  baseline_kw   numeric(8, 3) not null,                  -- snapshot at commit time
  actual_kw     numeric(8, 3),
  verified_kwh  numeric(10, 3),
  status        text not null default 'committed'
    check (status in ('committed', 'verified', 'unverified', 'flagged')),
  created_at    timestamptz not null default now(),
  unique (alert_id, household_id)
);
create index commitments_alert_idx on commitments (alert_id);

create table meter_readings (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references households (id) on delete cascade,
  commitment_id  uuid references commitments (id) on delete cascade, -- null: rehearsal
  kind           text not null check (kind in ('rehearsal', 'before', 'after')),
  reading_kwh    numeric(12, 2) not null check (reading_kwh >= 0),
  captured_at    timestamptz not null default now(),     -- server time of upload
  photo_url      text,                                   -- null for AMI feed rows
  photo_hash     text,                                   -- [+] rejects reused photos
  check_status   text not null default 'pass' check (check_status in ('pass', 'flagged', 'rejected')),
  flags          text[] not null default '{}',           -- [+] which rule checks failed
  reviewed_by    text,                                   -- [+] who approved or rejected a flagged reading
  -- no resubmission: one before and one after per commitment
  unique (commitment_id, kind)
);
create unique index meter_readings_photo_hash_idx on meter_readings (photo_hash) where photo_hash is not null;
create index meter_readings_flagged_idx on meter_readings (check_status) where check_status = 'flagged';

create table rewards (
  id             uuid primary key default gen_random_uuid(),
  commitment_id  uuid not null unique references commitments (id) on delete cascade,
  credit_php     numeric(10, 2) not null default 0,
  bonus_php      numeric(10, 2) not null default 0,
  points         integer not null default 0,
  created_at     timestamptz not null default now()
);

-- /sim/reset is `delete from households where is_simulated`; the cascades above
-- remove the simulated appliances, commitments, readings and rewards with them.
