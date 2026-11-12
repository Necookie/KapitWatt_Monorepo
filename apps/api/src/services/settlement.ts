import {
  acquireSettlementLease,
  dueAlertIds,
  getAlert,
  getSettlement,
  listAlertTargets,
  listSettlementCommitments,
  releaseSettlementLease,
  writeSettlement,
  type Db,
  type SettledCommitment,
  type SettlementCommitmentRow,
} from '@kapitwatt/db';
import {
  actualKwFromReadings,
  AMI_INTERVAL_MIN,
  AMI_MIN_COVERAGE,
  barangayTargetHit,
  computeReward,
  contributionDelta,
  roundKw,
  SETTLEMENT_DELAY_MIN,
  SETTLEMENT_GRACE_MIN,
  verifyCut,
  type ResultReason,
  type SettlementResult,
} from '@kapitwatt/shared';
import { AppError, conflict, isUniqueViolation, notFound } from '../lib/errors';
import { logError, logInfo } from '../lib/log';

const HOUR_MS = 3_600_000;

interface Measured {
  status: SettledCommitment['status'];
  actualKw: number | null;
  paidCutKw: number;
  verifiedKwh: number;
  resultReason: ResultReason | null;
}

const unpaid = (
  status: SettledCommitment['status'],
  resultReason: ResultReason,
  actualKw: number | null = null,
): Measured => ({ status, actualKw, paidCutKw: 0, verifiedKwh: 0, resultReason });

/**
 * One commitment's verified cut (plan section 6), with the same shared math the live totals use.
 * Photo path: both photos must have passed (or been approved); a flagged photo waits for review
 * (status flagged, no payout yet); a late one or a missing one earns nothing. Smart-meter path:
 * at least AMI_MIN_COVERAGE of the window's intervals, else flagged as missing data (FR-API-59).
 * A cut that measures zero is unverified, so it never earns the barangay bonus.
 */
export function measureCommitment(c: SettlementCommitmentRow, windowHours: number): Measured {
  let actualKw: number;
  if (c.path === 'photo') {
    const { before, after } = c;
    if (!before || !after) return unpaid('unverified', 'missing_photo');
    const readings = [before, after];
    if (readings.some((r) => r.flags.includes('late'))) return unpaid('unverified', 'late_photo');
    if (readings.some((r) => r.status === 'rejected')) return unpaid('unverified', 'failed_check');
    if (readings.some((r) => r.status !== 'pass')) return unpaid('flagged', 'failed_check');
    const hours = (after.at.getTime() - before.at.getTime()) / HOUR_MS;
    if (hours <= 0) return unpaid('unverified', 'failed_check');
    actualKw = actualKwFromReadings(before.kwh, after.kwh, hours);
  } else {
    const expected = Math.floor((windowHours * 60) / AMI_INTERVAL_MIN);
    if (expected === 0 || c.amiIntervals / expected < AMI_MIN_COVERAGE) {
      return unpaid('flagged', 'missing_ami_data');
    }
    actualKw = roundKw(c.amiKwh / ((c.amiIntervals * AMI_INTERVAL_MIN) / 60));
  }
  const cut = verifyCut({
    baselineKw: c.baselineKw,
    actualKw,
    committedKw: c.committedKw,
    billAvgKwhMonth: c.billAvgKwhMonth,
    windowHours,
  });
  if (cut.verifiedKwh <= 0) return unpaid('unverified', 'no_measured_cut', actualKw);
  return {
    status: 'verified',
    actualKw,
    paidCutKw: cut.paidCutKw,
    verifiedKwh: cut.verifiedKwh,
    resultReason: null,
  };
}

/**
 * How a settled result moves the household's trust score (P1, placeholder weights): a clean verified
 * event raises it; a flagged or rejected reading, or a missing or late photo, lowers it. Missing AMI
 * data and a zero cut are not the household's doing and leave it alone.
 */
export function trustDelta(m: Pick<Measured, 'status' | 'resultReason'>): number {
  return contributionDelta(m.status === 'verified', m.resultReason);
}

/**
 * The whole settlement of an alert, pure. Barangay delivered kW is the sum of paid cuts of verified
 * commitments; at 100% of its target every verified household there gets the bonus on its own
 * credit. Every commitment gets a reward row (zero when unpaid).
 */
export function computeSettlement(
  commitments: SettlementCommitmentRow[],
  targets: { barangayId: string; targetKw: number }[],
  windowHours: number,
): { results: SettledCommitment[]; verifiedCount: number; deliveredKw: number } {
  const measured = commitments.map((c) => ({ c, m: measureCommitment(c, windowHours) }));
  const delivered = new Map<string, number>();
  for (const { c, m } of measured) {
    if (m.status === 'verified')
      delivered.set(c.barangayId, (delivered.get(c.barangayId) ?? 0) + m.paidCutKw);
  }
  const target = new Map(targets.map((t) => [t.barangayId, t.targetKw]));
  const hit = (barangayId: string) =>
    barangayTargetHit(roundKw(delivered.get(barangayId) ?? 0), target.get(barangayId) ?? 0);

  const results = measured.map(({ c, m }): SettledCommitment => {
    const reward =
      m.status === 'verified'
        ? computeReward(m.verifiedKwh, c.path, hit(c.barangayId))
        : { creditPhp: 0, bonusPhp: 0, points: 0 };
    return {
      id: c.id,
      householdId: c.householdId,
      trustDelta: trustDelta(m),
      status: m.status,
      actualKw: m.actualKw,
      verifiedKwh: m.verifiedKwh,
      resultReason: m.resultReason,
      ...reward,
    };
  });
  return {
    results,
    verifiedCount: results.filter((r) => r.status === 'verified').length,
    deliveredKw: roundKw([...delivered.values()].reduce((a, b) => a + b, 0)),
  };
}

/**
 * Settles one alert. `force` (the operator's Settle, or the demo after Measure) skips the 30-minute
 * after-photo wait but never settles before the window has ended. Safe to call repeatedly or
 * concurrently: a settled alert returns its recorded result.
 */
export async function settleAlert(
  db: Db,
  alertId: string,
  opts: { isDemo: boolean; force: boolean },
): Promise<SettlementResult | null> {
  const lease = await acquireSettlementLease(db, alertId, {
    ...opts,
    delayMinutes: SETTLEMENT_DELAY_MIN + SETTLEMENT_GRACE_MIN,
  });
  if (!lease) {
    const existing = await getSettlement(db, alertId);
    if (existing) return existing;
    if (!opts.force) return null; // cron: not due or someone else is on it
    const alert = await getAlert(db, alertId, opts.isDemo);
    if (!alert) throw notFound('Alert');
    if (alert.storedStatus === 'cancelled')
      throw conflict('alert_closed', 'This alert was cancelled.');
    if (alert.storedStatus === 'settling') {
      throw conflict('settling_in_progress', 'Settlement is already running. Try again shortly.');
    }
    throw new AppError(
      409,
      'window_open',
      'Settle after the window ends. Use Measure (fast-forward) first.',
    );
  }

  try {
    const [commitments, targets] = await Promise.all([
      listSettlementCommitments(db, alertId),
      listAlertTargets(db, alertId),
    ]);
    const windowHours = (lease.windowEnd.getTime() - lease.windowStart.getTime()) / HOUR_MS;
    const { results, verifiedCount, deliveredKw } = computeSettlement(
      commitments,
      targets,
      windowHours,
    );
    await writeSettlement(db, alertId, results, { verifiedCount, deliveredKw });
    logInfo('settled', { alertId, commitments: results.length, verifiedCount, deliveredKw });
  } catch (err) {
    if (!isUniqueViolation(err)) {
      await releaseSettlementLease(db, alertId).catch(() => {});
      throw err;
    }
    // Another run settled it first; its result stands.
  }
  const settled = await getSettlement(db, alertId);
  if (!settled) throw new Error('settlement not recorded');
  return settled;
}

/** Cron: settle every alert that is due. Errors are logged per alert and never stop the others. */
export async function settleDueAlerts(db: Db, isDemo: boolean): Promise<number> {
  const due = await dueAlertIds(db, isDemo, SETTLEMENT_DELAY_MIN + SETTLEMENT_GRACE_MIN);
  let settled = 0;
  for (const id of due) {
    try {
      if (await settleAlert(db, id, { isDemo, force: false })) settled++;
    } catch (err) {
      logError('cron_settle_failed', err, { alertId: id });
    }
  }
  return settled;
}
