-- KapitWatt 0002: what the API build needs. Mirrors packages/shared/src/schemas/entities.ts.
--
-- Decisions behind it (see CLAUDE.md "Open decisions"): photos live in a private R2 bucket, so readings
-- keep an object key, never a URL; smart-meter 5-minute data gets its own table; settlement is
-- idempotent through the settlements table; demo fast-forward is a per-alert clock offset.

-- Alerts -------------------------------------------------------------------------------------------
-- Stored status is only active, settling (a settlement lease), settled or cancelled. The phases a client
-- sees (commits open, window open, measuring) are derived from the clock on read.
alter table alerts
  -- Demo only: seconds added to server time for this alert (Measure / fast-forward). Ignored unless
  -- APP_ENV is demo. integer, not bigint, so the HTTP driver returns a number.
  add column clock_offset_sec    integer not null default 0 check (clock_offset_sec >= 0),
  add column settling_started_at timestamptz,
  add column settled_at          timestamptz,
  add column cancelled_at        timestamptz,
  add column push_sent_at        timestamptz,
  -- A double-clicked confirm creates one alert and sends one push.
  add column idempotency_key     text unique;

-- The alert's target split across barangays (by opted-in households), with operator overrides.
-- Stored at creation so totals, settlement and the bonus always use the same list.
create table alert_barangay_targets (
  alert_id     uuid not null references alerts (id) on delete cascade,
  barangay_id  uuid not null references barangays (id),
  target_kw    numeric(10, 2) not null check (target_kw >= 0),
  is_override  boolean not null default false,
  primary key (alert_id, barangay_id)
);

-- One row per settled alert. Settlement inserts it first inside its transaction, so a concurrent second
-- settlement fails on the primary key and rolls back entirely.
create table settlements (
  alert_id        uuid primary key references alerts (id) on delete cascade,
  settled_at      timestamptz not null default now(),
  verified_count  integer not null,
  delivered_kw    numeric(10, 2) not null
);

-- Smart-meter interval data --------------------------------------------------------------------------
-- 5-minute energy per household from the AMI feed (simulated in the demo).
create table ami_intervals (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households (id) on delete cascade,
  interval_start  timestamptz not null,
  kwh             numeric(8, 3) not null check (kwh >= 0),
  is_simulated    boolean not null default false,
  unique (household_id, interval_start)
);

-- Meter readings (photo path only) -------------------------------------------------------------------
alter table meter_readings rename column photo_url to photo_key; -- R2 object key, never a public URL
alter table meter_readings
  add column lat          double precision,  -- GPS sent with the photo, kept for review
  add column lng          double precision,
  -- Real server time of the upload. captured_at is the alert's effective time (server time plus the demo
  -- offset), which the kW measurement uses; outside the demo the two are equal.
  add column received_at  timestamptz not null default now(),
  add column reviewed_at  timestamptz,
  alter column captured_at drop default;
create index meter_readings_household_idx on meter_readings (household_id, captured_at desc);

-- Commitments and households -------------------------------------------------------------------------
alter table commitments add column result_reason text; -- why a commitment earned nothing
create index commitments_household_idx on commitments (household_id);

alter table households add column token_created_at timestamptz;
