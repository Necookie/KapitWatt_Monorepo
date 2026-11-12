import {
  commitmentTimes,
  funnelByPath,
  getAlert,
  listAlertHistory,
  outcomeCounts,
  payoutTotals,
  type Db,
  type FunnelRow,
} from '@kapitwatt/db';
import {
  AMI_INTERVAL_MIN,
  AMI_MIN_COVERAGE,
  roundKw,
  roundPhp,
  type AlertAnalytics,
  type AlertHistoryItem,
  type AnalyticsOutcome,
  type FunnelStage,
  type ResultReason,
} from '@kapitwatt/shared';
import { notFound } from '../lib/errors';
import { deriveAlertStatus } from './alert-view';
import { alertTotals } from './totals';

const HOUR_MS = 3_600_000;
const TIMELINE_POINTS = 60;

/** What became of a commitment, in the operator's terms. */
export function outcomeOf(status: string, reason: ResultReason | null): AnalyticsOutcome {
  if (status === 'verified') return 'verified';
  if (status === 'committed') return 'awaiting_settlement';
  if (status === 'flagged')
    return reason === 'missing_ami_data' ? 'missing_ami_data' : 'pending_review';
  return reason ?? 'failed_check';
}

/** The funnel, one row per stage, smart meter and photo side by side. */
export function funnelStages(rows: FunnelRow[]): AlertAnalytics['funnel'] {
  const ami = rows.find((r) => r.path === 'ami');
  const photo = rows.find((r) => r.path === 'photo');
  const stage = (
    s: FunnelStage,
    pickAmi: (r: FunnelRow) => number,
    pickPhoto: (r: FunnelRow) => number,
  ) => ({
    stage: s,
    ami: ami ? pickAmi(ami) : 0,
    photo: photo ? pickPhoto(photo) : 0,
  });
  return [
    stage(
      'committed',
      (r) => r.committed,
      (r) => r.committed,
    ),
    stage(
      'evidence_started',
      (r) => r.amiAny,
      (r) => r.beforeSent,
    ),
    stage(
      'evidence_complete',
      (r) => r.amiComplete,
      (r) => r.bothPassed,
    ),
    stage(
      'verified',
      (r) => r.verified,
      (r) => r.verified,
    ),
  ];
}

/**
 * Cumulative committed kW over time, sampled at up to `points` evenly spaced moments between the
 * first and the last commitment (so a 25-second paced run and a slow real one both draw cleanly).
 */
export function commitTimeline(
  rows: { at: Date; kw: number }[],
  points = TIMELINE_POINTS,
): AlertAnalytics['timeline'] {
  if (rows.length === 0) return [];
  const first = rows[0]!.at.getTime();
  const last = rows[rows.length - 1]!.at.getTime();
  const steps = last === first ? 0 : Math.min(points, rows.length) - 1;
  const out: AlertAnalytics['timeline'] = [];
  let i = 0;
  let kw = 0;
  for (let s = 0; s <= steps; s++) {
    const t = steps === 0 ? last : first + ((last - first) * s) / steps;
    while (i < rows.length && rows[i]!.at.getTime() <= t) {
      kw += rows[i]!.kw;
      i++;
    }
    out.push({ at: new Date(t).toISOString(), committedKw: roundKw(kw), households: i });
  }
  return out;
}

/** GET /analytics/alerts/:id. */
export async function alertAnalytics(
  db: Db,
  alertId: string,
  isDemo: boolean,
): Promise<AlertAnalytics> {
  const alert = await getAlert(db, alertId, isDemo);
  if (!alert) throw notFound('Alert');
  const windowHours = (alert.windowEnd.getTime() - alert.windowStart.getTime()) / HOUR_MS;
  const minIntervals = Math.ceil(((windowHours * 60) / AMI_INTERVAL_MIN) * AMI_MIN_COVERAGE);
  const [funnel, outcomes, payouts, times, totals] = await Promise.all([
    funnelByPath(db, alertId, minIntervals),
    outcomeCounts(db, alertId),
    payoutTotals(db, alertId),
    commitmentTimes(db, alertId),
    alertTotals(db, alertId, isDemo),
  ]);

  const tally = new Map<AnalyticsOutcome, number>();
  for (const o of outcomes) {
    const key = outcomeOf(o.status, o.reason);
    tally.set(key, (tally.get(key) ?? 0) + o.n);
  }
  const verifiedKwh = funnel.reduce((sum, r) => sum + r.verifiedKwh, 0);
  const paid = payouts.creditPhp + payouts.bonusPhp;

  return {
    alertId,
    status: deriveAlertStatus(
      alert.storedStatus,
      alert.windowStart,
      alert.windowEnd,
      alert.effectiveNow,
    ),
    targetKw: alert.targetKw,
    optedInHouseholds: totals.barangays.reduce((sum, b) => sum + (b.households ?? 0), 0),
    committedHouseholds: totals.committedHouseholds ?? 0,
    committedKw: totals.committedKw,
    deliveredKw: totals.deliveredKw,
    verifiedKwh: Math.round(verifiedKwh * 1000) / 1000,
    barangays: totals.barangays.length,
    barangaysAtTarget: totals.barangays.filter((b) => b.targetHit).length,
    funnel: funnelStages(funnel),
    outcomes: [...tally].map(([outcome, households]) => ({ outcome, households })),
    payouts: {
      creditPhp: roundPhp(payouts.creditPhp),
      bonusPhp: roundPhp(payouts.bonusPhp),
      points: payouts.points,
      costPerKwhPhp: verifiedKwh > 0 ? roundPhp(paid / verifiedKwh) : null,
    },
    timeline: commitTimeline(times),
  };
}

/** GET /analytics/history. */
export async function alertHistory(
  db: Db,
  limit: number,
  isDemo: boolean,
): Promise<AlertHistoryItem[]> {
  return (await listAlertHistory(db, limit, isDemo)).map((r) => ({
    alertId: r.alertId,
    level: r.level,
    status: deriveAlertStatus(r.storedStatus, r.windowStart, r.windowEnd, r.effectiveNow),
    createdAt: r.createdAt.toISOString(),
    windowStart: r.windowStart.toISOString(),
    targetKw: r.targetKw,
    committedHouseholds: r.committedHouseholds,
    committedKw: roundKw(r.committedKw),
    deliveredKw: r.deliveredKw,
    verifiedCount: r.verifiedCount,
    paidPhp: roundPhp(r.paidPhp),
  }));
}
