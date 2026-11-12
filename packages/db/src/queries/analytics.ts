import type { AlertLevel, ResultReason, VerificationPath } from '@kapitwatt/shared';
import type { Db } from '../index';
import type { StoredAlertStatus } from './alerts';

/**
 * Analytics for the operator. Every query aggregates in SQL; no household row leaves the database.
 * Each is one round trip whatever the number of households.
 */

export interface FunnelRow {
  path: VerificationPath;
  committed: number;
  committedKw: number;
  beforeSent: number;
  bothPassed: number;
  amiAny: number;
  amiComplete: number;
  verified: number;
  verifiedKwh: number;
  /** Credit plus bonus paid to this path. */
  paidPhp: number;
}

/** Funnel counts per verification path. `minIntervals` is the AMI coverage threshold in intervals. */
export async function funnelByPath(
  db: Db,
  alertId: string,
  minIntervals: number,
): Promise<FunnelRow[]> {
  const rows = await db`
    select c.path,
           count(*)::int as committed,
           coalesce(sum(c.committed_kw), 0) as committed_kw,
           count(*) filter (where rb.id is not null)::int as before_sent,
           count(*) filter (where rb.check_status = 'pass' and ra.check_status = 'pass')::int as both_passed,
           count(*) filter (where coalesce(ami.n, 0) > 0)::int as ami_any,
           count(*) filter (where coalesce(ami.n, 0) >= ${minIntervals})::int as ami_complete,
           count(*) filter (where c.status = 'verified')::int as verified,
           coalesce(sum(c.verified_kwh) filter (where c.status = 'verified'), 0) as verified_kwh,
           coalesce(sum(rw.credit_php + rw.bonus_php), 0) as paid
    from commitments c
    join alerts a on a.id = c.alert_id
    left join rewards rw on rw.commitment_id = c.id
    left join meter_readings rb on rb.commitment_id = c.id and rb.kind = 'before'
    left join meter_readings ra on ra.commitment_id = c.id and ra.kind = 'after'
    left join lateral (
      select count(*)::int as n from ami_intervals i
      where c.path = 'ami' and i.household_id = c.household_id
        and i.interval_start >= a.window_start and i.interval_start < a.window_end
    ) ami on true
    where c.alert_id = ${alertId}
    group by c.path`;
  return rows.map((r) => ({
    path: r.path as VerificationPath,
    committed: Number(r.committed),
    committedKw: Number(r.committed_kw),
    beforeSent: Number(r.before_sent),
    bothPassed: Number(r.both_passed),
    amiAny: Number(r.ami_any),
    amiComplete: Number(r.ami_complete),
    verified: Number(r.verified),
    verifiedKwh: Number(r.verified_kwh),
    paidPhp: Number(r.paid),
  }));
}

/** How many commitments ended in each status and reason. */
export async function outcomeCounts(
  db: Db,
  alertId: string,
): Promise<{ status: string; reason: ResultReason | null; n: number }[]> {
  const rows = await db`
    select status, result_reason, count(*)::int as n
    from commitments where alert_id = ${alertId}
    group by status, result_reason`;
  return rows.map((r) => ({
    status: r.status as string,
    reason: (r.result_reason as ResultReason | null) ?? null,
    n: Number(r.n),
  }));
}

export async function payoutTotals(
  db: Db,
  alertId: string,
): Promise<{ creditPhp: number; bonusPhp: number; points: number }> {
  const [r] = await db`
    select coalesce(sum(r.credit_php), 0) as credit, coalesce(sum(r.bonus_php), 0) as bonus,
           coalesce(sum(r.points), 0)::int as points
    from rewards r join commitments c on c.id = r.commitment_id
    where c.alert_id = ${alertId}`;
  return {
    creditPhp: Number(r?.credit ?? 0),
    bonusPhp: Number(r?.bonus ?? 0),
    points: Number(r?.points ?? 0),
  };
}

/** Commitment times and sizes, oldest first (for the cumulative commit timeline). */
export async function commitmentTimes(
  db: Db,
  alertId: string,
): Promise<{ at: Date; kw: number }[]> {
  const rows = await db`
    select created_at, committed_kw from commitments
    where alert_id = ${alertId} order by created_at`;
  return rows.map((r) => ({ at: r.created_at as Date, kw: Number(r.committed_kw) }));
}

export interface AlertHistoryRow {
  alertId: string;
  level: AlertLevel;
  storedStatus: StoredAlertStatus;
  createdAt: Date;
  windowStart: Date;
  windowEnd: Date;
  targetKw: number;
  committedHouseholds: number;
  committedKw: number;
  deliveredKw: number | null;
  verifiedCount: number | null;
  verifiedKwh: number;
  paidPhp: number;
  effectiveNow: Date;
}

/** Recent alerts with their commitment and payout totals, newest first. */
export async function listAlertHistory(
  db: Db,
  limit: number,
  isDemo: boolean,
): Promise<AlertHistoryRow[]> {
  const rows = await db`
    select a.id, a.level, a.status, a.created_at, a.window_start, a.window_end, a.target_kw,
           now() + make_interval(secs => case when ${isDemo} then a.clock_offset_sec else 0 end)
             as effective_now,
           coalesce(c.households, 0) as households, coalesce(c.committed_kw, 0) as committed_kw,
           coalesce(c.paid, 0) as paid, coalesce(c.verified_kwh, 0) as verified_kwh,
           s.delivered_kw, s.verified_count
    from alerts a
    left join lateral (
      select count(*)::int as households, sum(cm.committed_kw) as committed_kw,
             sum(coalesce(r.credit_php, 0) + coalesce(r.bonus_php, 0)) as paid,
             sum(cm.verified_kwh) filter (where cm.status = 'verified') as verified_kwh
      from commitments cm left join rewards r on r.commitment_id = cm.id
      where cm.alert_id = a.id
    ) c on true
    left join settlements s on s.alert_id = a.id
    order by a.created_at desc
    limit ${limit}`;
  return rows.map((r) => ({
    alertId: r.id as string,
    level: r.level as AlertLevel,
    storedStatus: r.status as StoredAlertStatus,
    createdAt: r.created_at as Date,
    windowStart: r.window_start as Date,
    windowEnd: r.window_end as Date,
    targetKw: Number(r.target_kw),
    committedHouseholds: Number(r.households),
    committedKw: Number(r.committed_kw),
    deliveredKw: r.delivered_kw === null ? null : Number(r.delivered_kw),
    verifiedCount: r.verified_count === null ? null : Number(r.verified_count),
    verifiedKwh: Number(r.verified_kwh),
    paidPhp: Number(r.paid),
    effectiveNow: r.effective_now as Date,
  }));
}
