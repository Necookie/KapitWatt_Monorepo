import {
  getAlert,
  listAlertTargets,
  listTotalsCommitments,
  optedInCounts,
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
  type AlertStatus,
  type AlertTotals,
} from '@kapitwatt/shared';
import { notFound } from '../lib/errors';
import { deriveAlertStatus } from './alert-view';

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

export interface TotalsInput {
  alertId: string;
  targetKw: number;
  windowHours: number;
  status: AlertStatus;
  targets: AlertTargetRow[];
  commitments: TotalsCommitmentRow[];
  /** Opted-in households per barangay (what the target was split by). */
  optedIn: Record<string, number>;
}

interface Tally {
  committedKw: number;
  committedHouseholds: number;
  amiKw: number;
  photoKw: number;
}

/**
 * Live committed and delivered kW, overall and per targeted barangay, with delivered kW split by
 * verification path. Each barangay's delivered kW is the sum of its rounded path parts, so the parts
 * always add up to the total shown. Pure.
 */
export function computeTotals(input: TotalsInput): AlertTotals {
  const tally = new Map<string, Tally>();
  for (const c of input.commitments) {
    const t = tally.get(c.barangayId) ?? {
      committedKw: 0,
      committedHouseholds: 0,
      amiKw: 0,
      photoKw: 0,
    };
    t.committedKw += c.committedKw;
    t.committedHouseholds += 1;
    const kw = deliveredKw(c, input.windowHours);
    if (c.path === 'ami') t.amiKw += kw;
    else t.photoKw += kw;
    tally.set(c.barangayId, t);
  }

  const barangays = input.targets.map((target) => {
    const t = tally.get(target.barangayId);
    const deliveredAmiKw = roundKw(t?.amiKw ?? 0);
    const deliveredPhotoKw = roundKw(t?.photoKw ?? 0);
    const delivered = roundKw(deliveredAmiKw + deliveredPhotoKw);
    return {
      barangayId: target.barangayId,
      name: target.name,
      municipality: target.municipality,
      targetKw: target.targetKw,
      committedKw: roundKw(t?.committedKw ?? 0),
      deliveredKw: delivered,
      targetHit: barangayTargetHit(delivered, target.targetKw),
      households: input.optedIn[target.barangayId] ?? 0,
      committedHouseholds: t?.committedHouseholds ?? 0,
      deliveredAmiKw,
      deliveredPhotoKw,
    };
  });

  const total = (pick: (b: (typeof barangays)[number]) => number) =>
    roundKw(barangays.reduce((sum, b) => sum + pick(b), 0));
  return {
    alertId: input.alertId,
    targetKw: input.targetKw,
    committedKw: total((b) => b.committedKw),
    deliveredKw: total((b) => b.deliveredKw),
    barangays,
    status: input.status,
    committedHouseholds: barangays.reduce((sum, b) => sum + b.committedHouseholds, 0),
    deliveredAmiKw: total((b) => b.deliveredAmiKw),
    deliveredPhotoKw: total((b) => b.deliveredPhotoKw),
  };
}

/** GET /alerts/:id/totals. Four queries, whatever the number of households. */
export async function alertTotals(db: Db, alertId: string, isDemo: boolean): Promise<AlertTotals> {
  const alert = await getAlert(db, alertId, isDemo);
  if (!alert) throw notFound('Alert');
  const [targets, commitments, optedIn] = await Promise.all([
    listAlertTargets(db, alertId),
    listTotalsCommitments(db, alertId, isDemo),
    optedInCounts(db, alert.targetBarangayIds),
  ]);
  return computeTotals({
    alertId,
    targetKw: alert.targetKw,
    windowHours: (alert.windowEnd.getTime() - alert.windowStart.getTime()) / HOUR_MS,
    status: deriveAlertStatus(
      alert.storedStatus,
      alert.windowStart,
      alert.windowEnd,
      alert.effectiveNow,
    ),
    targets,
    commitments,
    optedIn,
  });
}
