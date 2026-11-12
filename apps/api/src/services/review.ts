import {
  getAlert,
  getReviewTarget,
  listAlertTargets,
  listFlaggedReadings,
  listSettlementCommitments,
  recordReview,
  verifiedKwhInBarangay,
  writeReviewResettlement,
  type Db,
} from '@kapitwatt/db';
import {
  barangayTargetHit,
  computeReward,
  REWARD,
  roundKw,
  TRUST,
  type FlaggedReading,
  type ReviewResult,
} from '@kapitwatt/shared';
import { conflict, notFound } from '../lib/errors';
import { logInfo } from '../lib/log';
import { measureCommitment, trustDelta } from './settlement';

const HOUR_MS = 3_600_000;

/** GET /readings/flagged (FR-API-41, FR-DASH-11). */
export async function flaggedReadings(db: Db, limit: number): Promise<FlaggedReading[]> {
  return (await listFlaggedReadings(db, limit)).map((r) => ({
    ...r,
    capturedAt: r.capturedAt.toISOString(),
  }));
}

/**
 * POST /readings/:id/review: a person approves (pass) or rejects a flagged reading.
 * - Before settlement: the reading's new status is simply what settlement will use.
 * - After settlement: that one commitment is settled again with the same measurement rules. An
 *   approved cut counts at full weight toward the barangay; if the barangay now reaches its target,
 *   every verified household there that lacked the bonus gets it. Trust is adjusted by the
 *   difference between the old and new outcome.
 */
export async function reviewReading(
  db: Db,
  readingId: string,
  decision: 'approve' | 'reject',
  isDemo: boolean,
): Promise<ReviewResult> {
  const target = await getReviewTarget(db, readingId);
  if (!target) throw notFound('Reading');
  if (target.checkStatus !== 'flagged') {
    throw conflict('not_flagged', 'Only flagged readings can be reviewed.');
  }
  if (target.alertStatus === 'settling') {
    throw conflict('settling_in_progress', 'Settlement is running. Try again shortly.');
  }
  if (!(await recordReview(db, readingId, decision, 'operator'))) {
    throw conflict('not_flagged', 'This reading was already reviewed.');
  }
  const checkStatus = decision === 'approve' ? 'pass' : 'rejected';
  logInfo('reading_reviewed', { readingId, decision });

  if (!target.commitmentId || !target.alertId || target.alertStatus !== 'settled') {
    return { readingId, checkStatus, commitment: null };
  }

  const alert = await getAlert(db, target.alertId, isDemo);
  if (!alert) throw notFound('Alert');
  const windowHours = (alert.windowEnd.getTime() - alert.windowStart.getTime()) / HOUR_MS;
  const [rows, targets, othersKwh] = await Promise.all([
    listSettlementCommitments(db, alert.id),
    listAlertTargets(db, alert.id),
    verifiedKwhInBarangay(db, alert.id, target.barangayId, target.commitmentId),
  ]);
  const row = rows.find((r) => r.id === target.commitmentId);
  if (!row) throw notFound('Commitment');

  // Before the review this commitment was held as flagged (failed_check); that is what trust saw.
  const before = { status: 'flagged' as const, resultReason: 'failed_check' as const };
  const m = measureCommitment(row, windowHours);
  const delivered = roundKw(othersKwh / windowHours + (m.status === 'verified' ? m.paidCutKw : 0));
  const targetKw = targets.find((t) => t.barangayId === target.barangayId)?.targetKw ?? 0;
  const hit = barangayTargetHit(delivered, targetKw);
  const reward =
    m.status === 'verified'
      ? computeReward(m.verifiedKwh, row.path, hit)
      : { creditPhp: 0, bonusPhp: 0, points: 0 };

  await writeReviewResettlement(db, {
    alertId: alert.id,
    barangayId: target.barangayId,
    commitmentId: row.id,
    householdId: row.householdId,
    status: m.status,
    actualKw: m.actualKw,
    verifiedKwh: m.verifiedKwh,
    resultReason: m.resultReason,
    ...reward,
    trustDelta: trustDelta(m) - trustDelta(before),
    barangayHit: hit,
    bonusRate: REWARD.barangayBonusRate,
    trustMin: TRUST.min,
    trustMax: TRUST.max,
  });
  return {
    readingId,
    checkStatus,
    commitment: { status: m.status, resultReason: m.resultReason, ...reward },
  };
}
