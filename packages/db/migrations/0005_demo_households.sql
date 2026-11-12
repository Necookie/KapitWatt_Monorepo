-- KapitWatt 0005: demo households.
--
-- The ten accounts the team logs into on stage (apps/api/scripts/demo-accounts.ts) are real households
-- with a login, but the demo reset gives them a scripted history: the simulator's service account may
-- commit and send readings for them in replayed past events, and the fake smart-meter feed covers them
-- in a live event. Nothing else treats them differently, and the simulator's reset never deletes them.
alter table households add column is_demo boolean not null default false;
create index households_demo_idx on households (is_demo) where is_demo;
