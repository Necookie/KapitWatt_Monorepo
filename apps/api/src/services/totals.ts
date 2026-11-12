import {
  getAlert,
  listAlertTargets,
  listTotalsCommitments,
  type AlertTargetRow,
  type Db,
  type TotalsCommitmentRow,
} from '@kapitwatt/db';
import {
  actualKwFromReadings,
  AMI_INTERVAL_MIN,
  barangayTargetHit,
  roundKw,
  verifyCut,
  type AlertTotals,
} from '@kapitwatt/shared';
import { notFound } from '../lib/errors';

const HOUR_MS = 3_600_000;

/**
 * Delivered kW of one commitment, as the barangay progress bar should count it right now:
 * - settled and verified: the paid cut (verified kWh over the scheduled window hours);
 * - settled without a verified cut: nothing;
 * - before settlement, photo path: the paid cut once both photos passed the checks;
 * - before settlement, smart-meter path: the paid cut measured from intervals so far.
 * Uses the same shared math as settlement, so live numbers and results agree.
 */
export function deliveredKw(c: TotalsCommitmentRow, windowHours: number): number {
  if (c.status === 'verified') return c.verifiedKwh === null ? 0 : c.verifiedKwh / windowHours;
  if (c.status !== 'committed') return 0;

  let actualKw: number | null = null;
  if (c.path === 'photo') {
    const { before, after } = c;
    if (before?.status !== 'pass' || after?.status !== 'pass') return 0;
    const hours = (after.at.getTime() - before.at.getTime()) / HOUR_MS;
    if (hours <= 0) return 0;
    actualKw = actualKwFromReadings(before.kwh, after.kwh, hours);
  } else {
    if (c.amiIntervals === 0) return 0;
    actualKw = roundKw(c.amiKwh / ((c.amiIntervals * AMI_INTERVAL_MIN) / 60));
  }
  return verifyCut({
    baselineKw: c.baselineKw,
    actualKw,
    committedKw: c.committedKw,
    billAvgKwhMonth: c.billAvgKwhMonth,
    windowHours,
  }).paidCutKw;
}

/** Live committed and delivered kW, overall and per targeted barangay. Pure. */
export function computeTotals(
  alertId: string,
  targetKw: number,
  windowHours: number,
  targets: AlertTargetRow[],
  commitments: TotalsCommitmentRow[],
): AlertTotals {
  const committed = new Map<string, number>();
  const delivered = new Map<string, number>();
  for (const c of commitments) {
    committed.set(c.barangayId, (committed.get(c.barangayId) ?? 0) + c.committedKw);
    delivered.set(c.barangayId, (delivered.get(c.barangayId) ?? 0) + deliveredKw(c, windowHours));
  }
  const barangays = targets.map((t) => {
    const d = roundKw(delivered.get(t.barangayId) ?? 0);
    return {
      barangayId: t.barangayId,
      name: t.name,
      municipality: t.municipality,
      targetKw: t.targetKw,
      committedKw: roundKw(committed.get(t.barangayId) ?? 0),
      deliveredKw: d,
      targetHit: barangayTargetHit(d, t.targetKw),
    };
  });
  const sum = (m: Map<string, number>) => roundKw([...m.values()].reduce((a, b) => a + b, 0));
  return {
    alertId,
    targetKw,
    committedKw: sum(committed),
    deliveredKw: sum(delivered),
    barangays,
  };
}

/** GET /alerts/:id/totals. Three queries, whatever the number of households. */
export async function alertTotals(db: Db, alertId: string, isDemo: boolean): Promise<AlertTotals> {
  const alert = await getAlert(db, alertId, isDemo);
  if (!alert) throw notFound('Alert');
  const [targets, commitments] = await Promise.all([
    listAlertTargets(db, alertId),
    listTotalsCommitments(db, alertId, isDemo),
  ]);
  const windowHours = (alert.windowEnd.getTime() - alert.windowStart.getTime()) / HOUR_MS;
  return computeTotals(alertId, alert.targetKw, windowHours, targets, commitments);
}
