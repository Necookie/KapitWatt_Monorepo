import {
  COMMIT_STEP_KW,
  MAX_COMMIT_KW,
  REWARD,
  type AlertLevel,
  type CheckStatus,
  type CommitmentStatus,
  type ReadingFlag,
  type ReadingKind,
  type VerificationPath,
} from '@kapitwatt/shared';
import type { Db } from '../index';

/**
 * Inserts commitments for one alert, one row per household, re-checking every rule in the same
 * statement so a request that races the window start cannot slip through:
 *   alert open (not settling/settled/cancelled) and its effective time before window start;
 *   household opted in, with a baseline, in a barangay the alert targets;
 *   committed kW within the commit cap: min(baseline, bill cap, MAX_COMMIT_KW) rounded down to the
 *   step (the same rule as services/cap.ts, computed exactly in numeric).
 * The verification path comes from the meter type and the baseline is snapshotted from the
 * household row, never from the caller. A household that already committed is skipped.
 * Works for one household (the app) or many (the simulator), in ONE query either way: on Workers
 * each query is a subrequest, so the simulator's paced run stays well inside the per-request limit.
 * `simulatedOnly` restricts the insert to simulated households (the simulator's service account).
 * Returns the household ids that got a commitment.
 */
export async function insertCommitments(
  db: Db,
  alertId: string,
  items: { householdId: string; committedKw: number }[],
  isDemo: boolean,
  opts: { simulatedOnly?: boolean } = {},
): Promise<string[]> {
  if (items.length === 0) return [];
  const steps = 1 / COMMIT_STEP_KW;
  const rows = await db`
    insert into commitments (alert_id, household_id, committed_kw, path, baseline_kw)
    select a.id, h.id, t.committed_kw,
           case when h.meter_type = 'ami' then 'ami' else 'photo' end,
           h.baseline_kw
    from unnest(${items.map((i) => i.householdId)}::uuid[], ${items.map((i) => i.committedKw)}::numeric[])
           as t(household_id, committed_kw)
    join households h on h.id = t.household_id
    join alerts a on a.id = ${alertId}
    where a.status not in ('settling', 'settled', 'cancelled')
      and now() + make_interval(secs => case when ${isDemo} then a.clock_offset_sec else 0 end)
          < a.window_start
      and h.opted_in
      and h.baseline_kw is not null
      and h.barangay_id = any(a.target_barangay_ids)
      and (not ${opts.simulatedOnly ?? false} or h.is_simulated)
      and t.committed_kw > 0
      and t.committed_kw <= floor(least(
            h.baseline_kw,
            ${REWARD.peakFactor}::numeric * h.bill_avg_kwh_month / ${REWARD.hoursPerMonth}::numeric,
            ${MAX_COMMIT_KW}::numeric
          ) * ${steps}) / ${steps}
    on conflict (alert_id, household_id) do nothing
    returning household_id`;
  return rows.map((r) => r.household_id as string);
}

export async function commitmentExists(
  db: Db,
  householdId: string,
  alertId: string,
): Promise<boolean> {
  const [r] = await db`
    select 1 from commitments where household_id = ${householdId} and alert_id = ${alertId}`;
  return r !== undefined;
}

export interface ReadingSummaryRow {
  id: string;
  kind: ReadingKind;
  readingKwh: number;
  capturedAt: Date;
  checkStatus: CheckStatus;
  flags: ReadingFlag[];
}

export interface HouseholdCommitmentRow {
  id: string;
  alertId: string;
  barangayId: string;
  committedKw: number;
  path: VerificationPath;
  baselineKw: number;
  status: CommitmentStatus;
  actualKw: number | null;
  verifiedKwh: number | null;
  resultReason: string | null;
  windowStart: Date;
  windowEnd: Date;
  effectiveNow: Date;
  before: ReadingSummaryRow | null;
  after: ReadingSummaryRow | null;
  /** Smart-meter path: energy and interval count so far in the window (up to effective now). */
  amiKwh: number;
  amiIntervals: number;
}

const toReading = (r: Record<string, unknown>, prefix: 'b' | 'a'): ReadingSummaryRow | null =>
  r[`${prefix}_id`] === null || r[`${prefix}_id`] === undefined
    ? null
    : {
        id: r[`${prefix}_id`] as string,
        kind: r[`${prefix}_kind`] as ReadingKind,
        readingKwh: Number(r[`${prefix}_kwh`]),
        capturedAt: r[`${prefix}_at`] as Date,
        checkStatus: r[`${prefix}_status`] as CheckStatus,
        flags: r[`${prefix}_flags`] as ReadingFlag[],
      };

/** One household's commitment for an alert, with its photo readings and live AMI energy. */
export async function getHouseholdCommitment(
  db: Db,
  householdId: string,
  alertId: string,
  isDemo: boolean,
): Promise<HouseholdCommitmentRow | null> {
  const [r] = await db`
    select c.id, c.alert_id, h.barangay_id, c.committed_kw, c.path, c.baseline_kw, c.status,
           c.actual_kw, c.verified_kwh, c.result_reason, a.window_start, a.window_end,
           now() + make_interval(secs => case when ${isDemo} then a.clock_offset_sec else 0 end)
             as effective_now,
           rb.id as b_id, rb.kind as b_kind, rb.reading_kwh as b_kwh, rb.captured_at as b_at,
           rb.check_status as b_status, rb.flags as b_flags,
           ra.id as a_id, ra.kind as a_kind, ra.reading_kwh as a_kwh, ra.captured_at as a_at,
           ra.check_status as a_status, ra.flags as a_flags,
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
    where c.household_id = ${householdId} and c.alert_id = ${alertId}`;
  if (!r) return null;
  return {
    id: r.id as string,
    alertId: r.alert_id as string,
    barangayId: r.barangay_id as string,
    committedKw: Number(r.committed_kw),
    path: r.path as VerificationPath,
    baselineKw: Number(r.baseline_kw),
    status: r.status as CommitmentStatus,
    actualKw: r.actual_kw === null ? null : Number(r.actual_kw),
    verifiedKwh: r.verified_kwh === null ? null : Number(r.verified_kwh),
    resultReason: (r.result_reason as string | null) ?? null,
    windowStart: r.window_start as Date,
    windowEnd: r.window_end as Date,
    effectiveNow: r.effective_now as Date,
    before: toReading(r, 'b'),
    after: toReading(r, 'a'),
    amiKwh: Number(r.ami_kwh),
    amiIntervals: Number(r.ami_n),
  };
}

export interface HistoryRow {
  alertId: string;
  level: AlertLevel;
  windowStart: Date;
  windowEnd: Date;
  committedKw: number;
  status: CommitmentStatus;
  verifiedKwh: number | null;
  creditPhp: number;
  bonusPhp: number;
  points: number;
}

/** A household's past and current events, newest first. */
export async function listHouseholdHistory(
  db: Db,
  householdId: string,
  limit: number,
): Promise<HistoryRow[]> {
  const rows = await db`
    select a.id as alert_id, a.level, a.window_start, a.window_end, c.committed_kw, c.status,
           c.verified_kwh, coalesce(r.credit_php, 0) as credit_php,
           coalesce(r.bonus_php, 0) as bonus_php, coalesce(r.points, 0) as points
    from commitments c
    join alerts a on a.id = c.alert_id
    left join rewards r on r.commitment_id = c.id
    where c.household_id = ${householdId}
    order by a.window_start desc
    limit ${limit}`;
  return rows.map((r) => ({
    alertId: r.alert_id as string,
    level: r.level as AlertLevel,
    windowStart: r.window_start as Date,
    windowEnd: r.window_end as Date,
    committedKw: Number(r.committed_kw),
    status: r.status as CommitmentStatus,
    verifiedKwh: r.verified_kwh === null ? null : Number(r.verified_kwh),
    creditPhp: Number(r.credit_php),
    bonusPhp: Number(r.bonus_php),
    points: Number(r.points),
  }));
}
