-- KapitWatt 0006: barangays at risk of a brownout.
--
-- The operator can mark some of an alert's target barangays as on the rotational brownout schedule
-- (simulated in the pilot: KapitWatt has no feeder or outage data). The app names those towns so
-- every targeted household can help them; who is alerted, the targets and the payouts do not change.
alter table alerts
  add column at_risk_barangay_ids uuid[] not null default '{}',
  add constraint alerts_at_risk_in_targets check (at_risk_barangay_ids <@ target_barangay_ids);
