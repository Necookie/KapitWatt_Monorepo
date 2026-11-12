import type { CommitmentStatus, ResultReason, VerificationPath } from '@kapitwatt/shared';
import type { Db } from '../index';

export interface ResultRow {
  alertId: string;
  barangayId: string;
  alertSettled: boolean;
  path: VerificationPath;
  status: CommitmentStatus;
  committedKw: number;
  baselineKw: number;
  actualKw: number | null;
  verifiedKwh: number | null;
  resultReason: ResultReason | null;
  windowHours: number;
  creditPhp: number;
  bonusPhp: number;
  points: number;
  hasReward: boolean;
}

/** One household's commitment for an alert with its reward (if settled). */
export async function getResultRow(
  db: Db,
  householdId: string,
  alertId: string,
): Promise<ResultRow | null> {
  const [r] = await db`
    select c.alert_id, h.barangay_id, a.status = 'settled' as alert_settled, c.path, c.status, c.committed_kw,
           c.baseline_kw, c.actual_kw, c.verified_kwh, c.result_reason,
           extract(epoch from (a.window_end - a.window_start)) / 3600 as window_hours,
           r.commitment_id is not null as has_reward,
           coalesce(r.credit_php, 0) as credit_php, coalesce(r.bonus_php, 0) as bonus_php,
           coalesce(r.points, 0) as points
    from commitments c
    join households h on h.id = c.household_id
    join alerts a on a.id = c.alert_id
    left join rewards r on r.commitment_id = c.id
    where c.household_id = ${householdId} and c.alert_id = ${alertId}`;
  if (!r) return null;
  return {
    alertId: r.alert_id as string,
    barangayId: r.barangay_id as string,
    alertSettled: r.alert_settled as boolean,
    path: r.path as VerificationPath,
    status: r.status as CommitmentStatus,
    committedKw: Number(r.committed_kw),
    baselineKw: Number(r.baseline_kw),
    actualKw: r.actual_kw === null ? null : Number(r.actual_kw),
    verifiedKwh: r.verified_kwh === null ? null : Number(r.verified_kwh),
    resultReason: (r.result_reason as ResultReason | null) ?? null,
    windowHours: Number(r.window_hours),
    creditPhp: Number(r.credit_php),
    bonusPhp: Number(r.bonus_php),
    points: Number(r.points),
    hasReward: r.has_reward as boolean,
  };
}

export async function getRewardsSummary(
  db: Db,
  householdId: string,
): Promise<{ points: number; creditPhp: number; bonusPhp: number; events: number }> {
  const [r] = await db`
    select coalesce(sum(r.points), 0)::int as points,
           coalesce(sum(r.credit_php), 0) as credit_php,
           coalesce(sum(r.bonus_php), 0) as bonus_php,
           count(r.commitment_id)::int as events
    from commitments c join rewards r on r.commitment_id = c.id
    where c.household_id = ${householdId}`;
  return {
    points: Number(r?.points ?? 0),
    creditPhp: Number(r?.credit_php ?? 0),
    bonusPhp: Number(r?.bonus_php ?? 0),
    events: Number(r?.events ?? 0),
  };
}

export interface LeaderboardDbRow {
  barangayId: string;
  name: string;
  municipality: string;
  verifiedKwh: number;
  points: number;
  households: number;
}

/**
 * Barangay ranking by verified kWh across settled events, real and simulated households together
 * (the pilot is both). Aggregates only: no household row ever leaves this query.
 */
export async function listLeaderboard(db: Db): Promise<LeaderboardDbRow[]> {
  const rows = await db`
    select b.id, b.name, b.municipality,
           coalesce(sum(c.verified_kwh) filter (where c.status = 'verified'), 0) as verified_kwh,
           coalesce(sum(r.points), 0)::int as points,
           (select count(*)::int from households h2 where h2.barangay_id = b.id and h2.opted_in)
             as households
    from barangays b
    left join households h on h.barangay_id = b.id
    left join commitments c on c.household_id = h.id
    left join rewards r on r.commitment_id = c.id
    group by b.id
    order by verified_kwh desc, b.municipality, b.name`;
  return rows.map((r) => ({
    barangayId: r.id as string,
    name: r.name as string,
    municipality: r.municipality as string,
    verifiedKwh: Number(r.verified_kwh),
    points: Number(r.points),
    households: Number(r.households),
  }));
}
