import {
  TRUST,
  type CheckStatus,
  type ReadingFlag,
  type ResultReason,
  type SettlementResult,
  type VerificationPath,
} from '@kapitwatt/shared';
import type { Db } from '../index';
import type { AlertRow } from './alerts';
import { getAlert } from './alerts';

/**
 * Settlement storage. Settlement is idempotent and atomic:
 *   1. a LEASE moves the alert to 'settling' (one runner at a time; a crashed run's lease expires);
 *   2. the service computes every result in memory from one read;
 *   3. one non-interactive transaction writes it all, starting with the settlements row, whose
 *      primary key makes a second concurrent settlement roll back entirely.
 */

/** How long a settlement lease lasts before another runner may take it over. */
const LEASE_MINUTES = 5;

/**
 * Takes the settlement lease if the alert is open (or its lease expired) and, unless forced, due:
 * effective time at or past window end + delayMinutes. Returns the alert, or null when it is not
 * this caller's to settle (already settled, cancelled, another run holds the lease, or not due).
 */
export async function acquireSettlementLease(
  db: Db,
  alertId: string,
  opts: { isDemo: boolean; force: boolean; delayMinutes: number },
): Promise<AlertRow | null> {
  const rows = await db`
    update alerts a set status = 'settling', settling_started_at = now()
    where a.id = ${alertId}
      and a.status not in ('settled', 'cancelled')
      and (a.status <> 'settling'
           or a.settling_started_at < now() - make_interval(mins => ${LEASE_MINUTES}))
      and now() + make_interval(secs => case when ${opts.isDemo} then a.clock_offset_sec else 0 end)
          >= a.window_end + make_interval(mins => case when ${opts.force} then 0 else ${opts.delayMinutes} end)
    returning a.id`;
  return rows.length ? getAlert(db, alertId, opts.isDemo) : null;
}

/** A failed settlement hands the alert back, so it can be retried at once instead of in 5 minutes. */
export async function releaseSettlementLease(db: Db, alertId: string): Promise<void> {
  await db`update alerts set status = 'active', settling_started_at = null
           where id = ${alertId} and status = 'settling'`;
}

/** Alerts whose settlement is due now (for the cron). */
export async function dueAlertIds(
  db: Db,
  isDemo: boolean,
  delayMinutes: number,
): Promise<string[]> {
  const rows = await db`
    select a.id from alerts a
    where a.status in ('active', 'settling')
      and now() + make_interval(secs => case when ${isDemo} then a.clock_offset_sec else 0 end)
          >= a.window_end + make_interval(mins => ${delayMinutes})
    order by a.window_end
    limit 20`;
  return rows.map((r) => r.id as string);
}

export interface SettlementReading {
  kwh: number;
  at: Date;
  status: CheckStatus;
  flags: ReadingFlag[];
}

export interface SettlementCommitmentRow {
  id: string;
  householdId: string;
  barangayId: string;
  path: VerificationPath;
  committedKw: number;
  baselineKw: number;
  billAvgKwhMonth: number;
  before: SettlementReading | null;
  after: SettlementReading | null;
  /** Smart-meter path: energy and interval count over the whole window. */
  amiKwh: number;
  amiIntervals: number;
}

/** Every commitment of the alert with its readings and its whole-window AMI energy. One query. */
export async function listSettlementCommitments(
  db: Db,
  alertId: string,
): Promise<SettlementCommitmentRow[]> {
  const rows = await db`
    select c.id, c.household_id, h.barangay_id, c.path, c.committed_kw, c.baseline_kw,
           h.bill_avg_kwh_month,
           rb.reading_kwh as b_kwh, rb.captured_at as b_at, rb.check_status as b_status, rb.flags as b_flags,
           ra.reading_kwh as a_kwh, ra.captured_at as a_at, ra.check_status as a_status, ra.flags as a_flags,
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
        and i.interval_start >= a.window_start and i.interval_start < a.window_end
    ) ami on true
    where c.alert_id = ${alertId}`;
  const reading = (p: 'b' | 'a', r: Record<string, unknown>): SettlementReading | null =>
    r[`${p}_kwh`] === null || r[`${p}_kwh`] === undefined
      ? null
      : {
          kwh: Number(r[`${p}_kwh`]),
          at: r[`${p}_at`] as Date,
          status: r[`${p}_status`] as CheckStatus,
          flags: r[`${p}_flags`] as ReadingFlag[],
        };
  return rows.map((r) => ({
    id: r.id as string,
    householdId: r.household_id as string,
    barangayId: r.barangay_id as string,
    path: r.path as VerificationPath,
    committedKw: Number(r.committed_kw),
    baselineKw: Number(r.baseline_kw),
    billAvgKwhMonth: Number(r.bill_avg_kwh_month),
    before: reading('b', r),
    after: reading('a', r),
    amiKwh: Number(r.ami_kwh),
    amiIntervals: Number(r.ami_n),
  }));
}

export interface SettledCommitment {
  id: string;
  householdId: string;
  /** Change to the household's trust score (P1). */
  trustDelta: number;
  status: 'verified' | 'unverified' | 'flagged';
  actualKw: number | null;
  verifiedKwh: number;
  resultReason: ResultReason | null;
  creditPhp: number;
  bonusPhp: number;
  points: number;
}

/**
 * Writes a settlement atomically. The settlements insert comes first: if another run already
 * settled this alert, its primary key fails and nothing else in the batch is applied. The alert is
 * marked settled last, and only if this run still holds the lease.
 */
export async function writeSettlement(
  db: Db,
  alertId: string,
  results: SettledCommitment[],
  summary: { verifiedCount: number; deliveredKw: number },
): Promise<void> {
  const col = <K extends keyof SettledCommitment>(k: K) => results.map((r) => r[k]);
  await db.transaction([
    db`insert into settlements (alert_id, verified_count, delivered_kw)
       values (${alertId}, ${summary.verifiedCount}, ${summary.deliveredKw})`,
    db`update commitments c
       set status = t.status, actual_kw = t.actual_kw, verified_kwh = t.verified_kwh,
           result_reason = t.reason
       from unnest(${col('id')}::uuid[], ${col('status')}::text[], ${col('actualKw')}::numeric[],
                   ${col('verifiedKwh')}::numeric[], ${col('resultReason')}::text[])
              as t(id, status, actual_kw, verified_kwh, reason)
       where c.id = t.id and c.alert_id = ${alertId}`,
    db`insert into rewards (commitment_id, credit_php, bonus_php, points)
       select t.id, t.credit, t.bonus, t.points
       from unnest(${col('id')}::uuid[], ${col('creditPhp')}::numeric[], ${col('bonusPhp')}::numeric[],
                   ${col('points')}::int[]) as t(id, credit, bonus, points)
       on conflict (commitment_id) do nothing`,
    db`update households h
       set trust_score = least(${TRUST.max}, greatest(${TRUST.min}, h.trust_score + t.delta))
       from unnest(${col('householdId')}::uuid[], ${col('trustDelta')}::numeric[]) as t(id, delta)
       where h.id = t.id and t.delta <> 0`,
    db`update alerts set status = 'settled', settled_at = now(), settling_started_at = null
       where id = ${alertId} and status = 'settling'`,
  ]);
}

/** The recorded settlement of an alert, or null if it has not settled. */
export async function getSettlement(db: Db, alertId: string): Promise<SettlementResult | null> {
  const [r] = await db`
    select s.alert_id, s.settled_at, s.verified_count, s.delivered_kw,
           (select count(*)::int from commitments c where c.alert_id = s.alert_id) as commitments
    from settlements s where s.alert_id = ${alertId}`;
  if (!r) return null;
  return {
    alertId: r.alert_id as string,
    settledAt: (r.settled_at as Date).toISOString(),
    commitments: Number(r.commitments),
    verifiedCount: Number(r.verified_count),
    deliveredKw: Number(r.delivered_kw),
  };
}

/** Demo only: move the alert's clock forward to a target time; never backwards, idempotent. */
export async function fastForwardAlert(
  db: Db,
  alertId: string,
  to: 'window_start' | 'window_end',
): Promise<boolean> {
  const rows = await db`
    update alerts a
    set clock_offset_sec = greatest(
          a.clock_offset_sec,
          ceil(extract(epoch from (case when ${to} = 'window_start' then a.window_start else a.window_end end) - now()))::int)
    where a.id = ${alertId} and a.status not in ('scheduled', 'settling', 'settled', 'cancelled')
    returning a.id`;
  return rows.length === 1;
}
