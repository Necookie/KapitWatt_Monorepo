import {
  commitmentExists,
  getAlert,
  getHouseholdCommitment,
  getHouseholdProfile,
  insertCommitments,
  listHouseholdHistory,
  type AlertRow,
  type Db,
  type HouseholdCommitmentRow,
  type HouseholdProfileRow,
  type ReadingSummaryRow,
} from '@kapitwatt/db';
import {
  AMI_INTERVAL_MIN,
  PHOTO_RULES,
  roundKw,
  type CommitmentView,
  type CreateCommitmentInput,
  type HistoryItem,
  type PhotoDeadlines,
  type ReadingSummary,
} from '@kapitwatt/shared';
import { AppError, conflict, notFound } from '../lib/errors';
import { commitCapKw } from './cap';
import { alertTotals } from './totals';

const MIN_MS = 60_000;

/**
 * Why a household may not commit to an alert right now, or null if it may. Pure, so every rule is
 * unit-tested. Error codes match what the household app handles. The insert re-checks the time and
 * state rules in SQL, so a request racing the window start still fails.
 */
export function commitRejection(
  household: HouseholdProfileRow,
  alert: AlertRow,
  committedKw: number,
): AppError | null {
  if (!household.optedIn) {
    return new AppError(403, 'opted_out', 'This household has opted out of alerts.');
  }
  if (household.baselineKw === null) {
    return household.meterType === 'standard'
      ? conflict('needs_rehearsal', 'Finish the rehearsal before committing.')
      : conflict('no_baseline', 'Your smart-meter baseline is not available yet.');
  }
  if (['settling', 'settled', 'cancelled'].includes(alert.storedStatus)) {
    return conflict('alert_closed', 'This alert is closed.');
  }
  if (!alert.targetBarangayIds.includes(household.barangayId)) {
    return new AppError(403, 'not_targeted', 'This alert is not for your barangay.');
  }
  if (alert.effectiveNow >= alert.windowStart) {
    return conflict('window_closed', 'Commitments closed when the peak window started.');
  }
  const cap = commitCapKw(household.baselineKw, household.billAvgKwhMonth) ?? 0;
  if (committedKw > cap + 1e-9) {
    return new AppError(422, 'above_cap', `That is above your maximum cut of ${cap} kW.`);
  }
  return null;
}

/** Photo deadlines on the alert's clock: before photo within 15 min of start, after within 30 of end. */
export function photoDeadlines(windowStart: Date, windowEnd: Date): PhotoDeadlines {
  const iso = (t: number) => new Date(t).toISOString();
  return {
    beforeOpensAt: windowStart.toISOString(),
    beforeClosesAt: iso(windowStart.getTime() + PHOTO_RULES.beforeDeadlineMin * MIN_MS),
    afterOpensAt: windowEnd.toISOString(),
    afterClosesAt: iso(windowEnd.getTime() + PHOTO_RULES.afterDeadlineMin * MIN_MS),
  };
}

/**
 * Smart-meter households see their reduction live while the window is open: baseline minus the
 * average kW measured so far. Not capped (that is settlement's job). Null when not applicable.
 */
export function liveReductionKw(c: HouseholdCommitmentRow): number | null {
  const inWindow = c.effectiveNow >= c.windowStart && c.effectiveNow < c.windowEnd;
  if (c.path !== 'ami' || !inWindow || c.amiIntervals === 0) return null;
  const actualKw = c.amiKwh / ((c.amiIntervals * AMI_INTERVAL_MIN) / 60);
  return roundKw(Math.max(0, c.baselineKw - actualKw));
}

const toReadingSummary = (r: ReadingSummaryRow | null): ReadingSummary | null =>
  r && {
    id: r.id,
    kind: r.kind,
    readingKwh: r.readingKwh,
    capturedAt: r.capturedAt.toISOString(),
    checkStatus: r.checkStatus,
    flags: r.flags,
  };

/** FR-API-13, 14, 18. */
export async function createCommitment(
  db: Db,
  householdId: string,
  input: CreateCommitmentInput,
  isDemo: boolean,
): Promise<CommitmentView> {
  const [household, alert] = await Promise.all([
    getHouseholdProfile(db, householdId),
    getAlert(db, input.alertId, isDemo),
  ]);
  if (!household) throw notFound('Household');
  if (!alert) throw notFound('Alert');
  if (await commitmentExists(db, householdId, alert.id)) {
    throw conflict('already_committed', 'You already committed to this event.');
  }
  const rejection = commitRejection(household, alert, input.committedKw);
  if (rejection) throw rejection;

  const inserted = await insertCommitments(
    db,
    alert.id,
    [{ householdId, committedKw: input.committedKw }],
    isDemo,
  );
  if (inserted.length === 0) {
    // The SQL guard refused: a duplicate request won the race, or the window just opened.
    if (await commitmentExists(db, householdId, alert.id)) {
      throw conflict('already_committed', 'You already committed to this event.');
    }
    throw conflict('window_closed', 'Commitments closed when the peak window started.');
  }
  return getCommitmentView(db, householdId, alert.id, isDemo);
}

/** FR-API-16: this household's commitment for an alert, with deadlines and barangay progress. */
export async function getCommitmentView(
  db: Db,
  householdId: string,
  alertId: string,
  isDemo: boolean,
): Promise<CommitmentView> {
  const c = await getHouseholdCommitment(db, householdId, alertId, isDemo);
  if (!c) throw new AppError(404, 'not_committed', 'No commitment for this alert.');
  const totals = await alertTotals(db, alertId, isDemo);
  const b = totals.barangays.find((x) => x.barangayId === c.barangayId);
  if (!b) throw new Error('commitment barangay missing from alert targets');
  return {
    id: c.id,
    alertId: c.alertId,
    committedKw: c.committedKw,
    path: c.path,
    baselineKw: c.baselineKw,
    status: c.status,
    actualKw: c.actualKw,
    verifiedKwh: c.verifiedKwh,
    resultReason: c.resultReason,
    deadlines: c.path === 'photo' ? photoDeadlines(c.windowStart, c.windowEnd) : null,
    readings: { before: toReadingSummary(c.before), after: toReadingSummary(c.after) },
    barangay: {
      barangayId: b.barangayId,
      name: b.name,
      targetKw: b.targetKw,
      deliveredKw: b.deliveredKw,
      progress: b.targetKw > 0 ? b.deliveredKw / b.targetKw : 0,
      targetHit: b.targetHit,
    },
    liveReductionKw: liveReductionKw(c),
    serverNow: c.effectiveNow.toISOString(),
  };
}

export async function history(db: Db, householdId: string, limit: number): Promise<HistoryItem[]> {
  return (await listHouseholdHistory(db, householdId, limit)).map((h) => ({
    alertId: h.alertId,
    level: h.level,
    windowStart: h.windowStart.toISOString(),
    windowEnd: h.windowEnd.toISOString(),
    committedKw: h.committedKw,
    status: h.status,
    verifiedKwh: h.verifiedKwh,
    creditPhp: h.creditPhp,
    bonusPhp: h.bonusPhp,
    points: h.points,
  }));
}
