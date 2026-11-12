-- KapitWatt 0003: scheduled sends, reminder pushes and the alert-lifted push (P1).
-- All additive and nullable. Each *_sent_at is set once, in the same statement that claims the send,
-- so overlapping cron runs never push the same reminder twice.

alter table alerts
  -- When to send a scheduled alert (status 'scheduled' until then). null: sent on creation.
  add column send_at                  timestamptz,
  -- Reminder to targeted households 15 minutes before the window (REMINDER_BEFORE_WINDOW_MIN).
  add column reminder_sent_at         timestamptz,
  -- Photo households with a commitment: "take your before photo" at window start ...
  add column before_reminder_sent_at  timestamptz,
  -- ... and "take your after photo" at window end.
  add column after_reminder_sent_at   timestamptz,
  -- The alert-lifted push after a cancel.
  add column lifted_push_sent_at      timestamptz;

create index alerts_scheduled_idx on alerts (send_at) where status = 'scheduled';
