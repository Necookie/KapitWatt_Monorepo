import type {
  AlertLevel,
  CheckStatus,
  CommitmentStatus,
  VerificationPath,
} from '@kapitwatt/shared';
import type { Db } from '../index';

/**
 * Alert queries. Time-dependent answers use the alert's EFFECTIVE time, computed in Postgres:
 * server time plus the alert's demo clock offset, and the offset only counts when isDemo is true.
 * One clock for everything (commit cutoff, photo deadlines, settlement), never the JS or phone clock.
 */

/** Stored statuses: active, settling (settlement lease), settled, cancelled. Phases are derived on read. */
export type StoredAlertStatus = 'scheduled' | 'active' | 'settling' | 'settled' | 'cancelled';

export interface AlertRow {
  id: string;
  level: AlertLevel;
  windowStart: Date;
  windowEnd: Date;
  targetKw: number;
  targetBarangayIds: string[];
  message: string;
  storedStatus: StoredAlertStatus;
  createdBy: string;
  createdAt: Date;
  clockOffsetSec: number;
  pushSentAt: Date | null;
  sendAt: Date | null;
  settledAt: Date | null;
  cancelledAt: Date | null;
  /** Server time plus the demo offset (demo only), from Postgres. */
  effectiveNow: Date;
}

type Row = Record<string, unknown>;

const toAlertRow = (r: Row): AlertRow => ({
  id: r.id as string,
  level: r.level as AlertLevel,
  windowStart: r.window_start as Date,
  windowEnd: r.window_end as Date,
  targetKw: Number(r.target_kw),
  targetBarangayIds: r.target_barangay_ids as string[],
  message: r.message as string,
  storedStatus: r.status as StoredAlertStatus,
  createdBy: r.created_by as string,
  createdAt: r.created_at as Date,
  clockOffsetSec: Number(r.clock_offset_sec),
  pushSentAt: (r.push_sent_at as Date | null) ?? null,
  sendAt: (r.send_at as Date | null) ?? null,
  settledAt: (r.settled_at as Date | null) ?? null,
  cancelledAt: (r.cancelled_at as Date | null) ?? null,
  effectiveNow: r.effective_now as Date,
});

export async function getAlert(db: Db, id: string, isDemo: boolean): Promise<AlertRow | null> {
  const [r] = await db`
    select a.*, now() + make_interval(secs => case when ${isDemo} then a.clock_offset_sec else 0 end)
             as effective_now
    from alerts a where a.id = ${id}`;
  return r ? toAlertRow(r) : null;
}

export async function findAlertByIdempotencyKey(
  db: Db,
  key: string,
  isDemo: boolean,
): Promise<AlertRow | null> {
  const [r] = await db`
    select a.*, now() + make_interval(secs => case when ${isDemo} then a.clock_offset_sec else 0 end)
             as effective_now
    from alerts a where a.idempotency_key = ${key}`;
  return r ? toAlertRow(r) : null;
}

/** The alert log, newest first. */
export async function listAlerts(db: Db, limit: number, isDemo: boolean): Promise<AlertRow[]> {
  const rows = await db`
    select a.*, now() + make_interval(secs => case when ${isDemo} then a.clock_offset_sec else 0 end)
             as effective_now
    from alerts a order by a.created_at desc limit ${limit}`;
  return rows.map(toAlertRow);
}

/**
 * The newest alert that is not settled or cancelled. With a barangay, only alerts that target it
 * (what a household should see); without one, any open alert. Scheduled (not yet sent) alerts are
 * included only when asked for: the operator sees them, a phone never does.
 */
export async function findOpenAlert(
  db: Db,
  barangayId: string | null,
  isDemo: boolean,
  includeScheduled = false,
): Promise<AlertRow | null> {
  const [r] = await db`
    select a.*, now() + make_interval(secs => case when ${isDemo} then a.clock_offset_sec else 0 end)
             as effective_now
    from alerts a
    where a.status not in ('settled', 'cancelled')
      -- Phones never see an alert before it is sent; the dashboard does.
      and (${includeScheduled} or a.status <> 'scheduled')
      and (${barangayId}::uuid is null or ${barangayId}::uuid = any(a.target_barangay_ids))
    order by a.created_at desc
    limit 1`;
  return r ? toAlertRow(r) : null;
}

/** All pilot barangay ids (for "all pilot areas"), or the subset of `ids` that exists. */
export async function existingBarangayIds(db: Db, ids: string[] | null): Promise<string[]> {
  const rows =
    ids === null
      ? await db`select id from barangays order by municipality, name`
      : await db`select id from barangays where id = any(${ids}::uuid[])`;
  return rows.map((r) => r.id as string);
}

/** Opted-in households per barangay (real and simulated), for splitting an alert's target. */
export async function optedInCounts(
  db: Db,
  barangayIds: string[],
): Promise<Record<string, number>> {
  const rows = await db`
    select b.id, count(h.id) filter (where h.opted_in)::int as n
    from barangays b left join households h on h.barangay_id = b.id
    where b.id = any(${barangayIds}::uuid[])
    group by b.id`;
  const out: Record<string, number> = {};
  for (const r of rows) out[r.id as string] = Number(r.n);
  return out;
}

export interface NewAlert {
  id: string;
  level: AlertLevel;
  windowStart: string;
  windowEnd: string;
  targetKw: number;
  targetBarangayIds: string[];
  message: string;
  createdBy: string;
  idempotencyKey: string | null;
  /** P1: send later; the alert stays 'scheduled' until then. */
  sendAt: string | null;
}

/** Stores the alert and its per-barangay targets atomically (the ids come from the caller). */
export async function insertAlertWithTargets(
  db: Db,
  a: NewAlert,
  targets: { barangayId: string; targetKw: number }[],
): Promise<void> {
  await db.transaction([
    db`insert into alerts (id, level, window_start, window_end, target_kw, target_barangay_ids, message,
                           status, created_by, idempotency_key, send_at)
       values (${a.id}, ${a.level}, ${a.windowStart}, ${a.windowEnd}, ${a.targetKw},
               ${a.targetBarangayIds}::uuid[], ${a.message},
               case when ${a.sendAt}::timestamptz is null then 'active' else 'scheduled' end,
               ${a.createdBy}, ${a.idempotencyKey}, ${a.sendAt}::timestamptz)`,
    db`insert into alert_barangay_targets (alert_id, barangay_id, target_kw, is_override)
       select ${a.id}, t.barangay_id, t.target_kw, false
       from unnest(${targets.map((t) => t.barangayId)}::uuid[], ${targets.map((t) => t.targetKw)}::numeric[])
         as t(barangay_id, target_kw)`,
  ]);
}

export interface AlertTargetRow {
  barangayId: string;
  name: string;
  municipality: string;
  targetKw: number;
  isOverride: boolean;
}

export async function listAlertTargets(db: Db, alertId: string): Promise<AlertTargetRow[]> {
  const rows = await db`
    select t.barangay_id, b.name, b.municipality, t.target_kw, t.is_override
    from alert_barangay_targets t join barangays b on b.id = t.barangay_id
    where t.alert_id = ${alertId}
    order by b.municipality, b.name`;
  return rows.map((r) => ({
    barangayId: r.barangay_id as string,
    name: r.name as string,
    municipality: r.municipality as string,
    targetKw: Number(r.target_kw),
    isOverride: r.is_override as boolean,
  }));
}

/**
 * Operator override of barangay shares. Writes only barangays the alert targets, and only while the
 * alert is still open (checked in the same statement). Returns the barangay ids actually updated.
 */
export async function overrideAlertTargets(
  db: Db,
  alertId: string,
  targets: { barangayId: string; targetKw: number }[],
): Promise<string[]> {
  const rows = await db`
    insert into alert_barangay_targets (alert_id, barangay_id, target_kw, is_override)
    select a.id, t.barangay_id, t.target_kw, true
    from unnest(${targets.map((t) => t.barangayId)}::uuid[], ${targets.map((t) => t.targetKw)}::numeric[])
           as t(barangay_id, target_kw)
    join alerts a on a.id = ${alertId}
      and a.status not in ('settling', 'settled', 'cancelled')
      and t.barangay_id = any(a.target_barangay_ids)
    on conflict (alert_id, barangay_id)
      do update set target_kw = excluded.target_kw, is_override = true
    returning barangay_id`;
  return rows.map((r) => r.barangay_id as string);
}

/** Expo tokens of real, opted-in households in the alert's barangays. Simulated rows never get push. */
export async function pushRecipients(db: Db, alertId: string): Promise<string[]> {
  const rows = await db`
    select distinct h.push_token
    from households h join alerts a on h.barangay_id = any(a.target_barangay_ids)
    where a.id = ${alertId} and h.opted_in and not h.is_simulated and h.push_token is not null`;
  return rows.map((r) => r.push_token as string);
}

/** Expo reported these tokens as no longer registered. */
export async function clearPushTokens(db: Db, tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  await db`update households set push_token = null where push_token = any(${tokens}::text[])`;
}

export async function markPushSent(db: Db, alertId: string): Promise<void> {
  await db`update alerts set push_sent_at = now() where id = ${alertId}`;
}

// ---- live totals ------------------------------------------------------------------------------

export interface TotalsCommitmentRow {
  id: string;
  barangayId: string;
  path: VerificationPath;
  status: CommitmentStatus;
  committedKw: number;
  baselineKw: number;
  billAvgKwhMonth: number;
  verifiedKwh: number | null;
  before: { kwh: number; at: Date; status: CheckStatus } | null;
  after: { kwh: number; at: Date; status: CheckStatus } | null;
  /** Smart-meter path: energy and interval count so far in the window (up to effective now). */
  amiKwh: number;
  amiIntervals: number;
}

/**
 * Every commitment of an alert with what live totals need: its before/after photo readings and,
 * for smart-meter households, the interval energy so far in the window. One query.
 */
export async function listTotalsCommitments(
  db: Db,
  alertId: string,
  isDemo: boolean,
): Promise<TotalsCommitmentRow[]> {
  const rows = await db`
    select c.id, h.barangay_id, c.path, c.status, c.committed_kw, c.baseline_kw, c.verified_kwh,
           h.bill_avg_kwh_month,
           rb.reading_kwh as before_kwh, rb.captured_at as before_at, rb.check_status as before_status,
           ra.reading_kwh as after_kwh, ra.captured_at as after_at, ra.check_status as after_status,
           coalesce(ami.kwh, 0) as ami_kwh, coalesce(ami.n, 0) as ami_n
    from commitments c
    join households h on h.id = c.household_id
    join alerts a on a.id = c.alert_id
    left join meter_readings rb on rb.commitment_id = c.id and rb.kind = 'before'
    left join meter_readings ra on ra.commitment_id = c.id and ra.kind = 'after'
    left join lateral (
      select sum(i.kwh) as kwh, count(*)::int as n
      from ami_intervals i
      where c.path = 'ami' and i.household_id = c.household_id
        and i.interval_start >= a.window_start
        and i.interval_start < least(a.window_end,
              now() + make_interval(secs => case when ${isDemo} then a.clock_offset_sec else 0 end))
    ) ami on true
    where c.alert_id = ${alertId}`;
  const reading = (kwh: unknown, at: unknown, status: unknown) =>
    kwh === null || kwh === undefined
      ? null
      : { kwh: Number(kwh), at: at as Date, status: status as CheckStatus };
  return rows.map((r) => ({
    id: r.id as string,
    barangayId: r.barangay_id as string,
    path: r.path as VerificationPath,
    status: r.status as CommitmentStatus,
    committedKw: Number(r.committed_kw),
    baselineKw: Number(r.baseline_kw),
    billAvgKwhMonth: Number(r.bill_avg_kwh_month),
    verifiedKwh: r.verified_kwh === null ? null : Number(r.verified_kwh),
    before: reading(r.before_kwh, r.before_at, r.before_status),
    after: reading(r.after_kwh, r.after_at, r.after_status),
    amiKwh: Number(r.ami_kwh),
    amiIntervals: Number(r.ami_n),
  }));
}

// ---- P1: cancel, scheduled sends, reminders -----------------------------------------------------

/**
 * Cancels an alert that has not settled. Returns the status it had (so the caller knows whether a
 * push ever went out), or null when it could not be cancelled.
 */
export async function cancelAlertRow(db: Db, alertId: string): Promise<string | null> {
  const rows = await db`
    update alerts a set status = 'cancelled', cancelled_at = now()
    from (select id, status from alerts where id = ${alertId} for update) prev
    where a.id = prev.id and prev.status in ('scheduled', 'active')
    returning prev.status as previous`;
  return rows.length ? (rows[0]!.previous as string) : null;
}

/** Claims the alert-lifted push once (first caller wins). */
export async function claimLiftedPush(db: Db, alertId: string): Promise<boolean> {
  const rows = await db`
    update alerts set lifted_push_sent_at = now()
    where id = ${alertId} and status = 'cancelled' and lifted_push_sent_at is null
    returning id`;
  return rows.length === 1;
}

/** Scheduled alerts whose send time has come: marks them active (sent) and returns their ids. */
export async function claimDueScheduledAlerts(db: Db): Promise<string[]> {
  const rows = await db`
    update alerts set status = 'active'
    where status = 'scheduled' and send_at <= now()
    returning id`;
  return rows.map((r) => r.id as string);
}

export type ReminderKind = 'pre_window' | 'before_photo' | 'after_photo';

/**
 * Claims the reminders that are due now, on each alert's clock, marking them sent in the same
 * statement so overlapping cron runs never send one twice. A reminder whose moment has passed (for
 * example after a fast-forward) is skipped, never sent late:
 *   pre_window    from window start - leadMinutes until window start
 *   before_photo  from window start until window start + beforeMinutes
 *   after_photo   from window end until window end + afterMinutes
 */
export async function claimDueReminders(
  db: Db,
  kind: ReminderKind,
  opts: { isDemo: boolean; leadMinutes: number; beforeMinutes: number; afterMinutes: number },
): Promise<string[]> {
  const now = db`now() + make_interval(secs => case when ${opts.isDemo} then a.clock_offset_sec else 0 end)`;
  const rows =
    kind === 'pre_window'
      ? await db`
          update alerts a set reminder_sent_at = now()
          where a.status = 'active' and a.reminder_sent_at is null
            and ${now} >= a.window_start - make_interval(mins => ${opts.leadMinutes})
            and ${now} < a.window_start
          returning a.id`
      : kind === 'before_photo'
        ? await db`
            update alerts a set before_reminder_sent_at = now()
            where a.status = 'active' and a.before_reminder_sent_at is null
              and ${now} >= a.window_start
              and ${now} < a.window_start + make_interval(mins => ${opts.beforeMinutes})
            returning a.id`
        : await db`
            update alerts a set after_reminder_sent_at = now()
            where a.status = 'active' and a.after_reminder_sent_at is null
              and ${now} >= a.window_end
              and ${now} < a.window_end + make_interval(mins => ${opts.afterMinutes})
            returning a.id`;
  return rows.map((r) => r.id as string);
}

/**
 * Expo tokens of real photo households that committed to the alert and have not sent this photo
 * yet: the people a before/after reminder is for.
 */
export async function photoReminderRecipients(
  db: Db,
  alertId: string,
  kind: 'before' | 'after',
): Promise<string[]> {
  const rows = await db`
    select distinct h.push_token
    from commitments c join households h on h.id = c.household_id
    where c.alert_id = ${alertId} and c.path = 'photo'
      and h.opted_in and not h.is_simulated and h.push_token is not null
      and not exists (select 1 from meter_readings m where m.commitment_id = c.id and m.kind = ${kind})`;
  return rows.map((r) => r.push_token as string);
}
