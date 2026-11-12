import {
  existingBarangayIds,
  fastForwardAlert,
  findAlertByIdempotencyKey,
  findOpenAlert,
  getAlert,
  getHouseholdProfile,
  insertAlertWithTargets,
  listAlerts,
  listAlertTargets,
  optedInCounts,
  overrideAlertTargets,
  type AlertRow,
  type Db,
} from '@kapitwatt/db';
import {
  MAX_WINDOW_HOURS,
  splitTargetKw,
  type AlertTargetsResponse,
  type AlertView,
  type CreateAlertInput,
  type UpdateTargetsInput,
} from '@kapitwatt/shared';
import { AppError, isUniqueViolation, notFound } from '../lib/errors';
import { toAlertView } from './alert-view';

const HOUR_MS = 3_600_000;

/** Rounds each share to 0.01 kW (the column's precision). */
const toShares = (split: Record<string, number>) =>
  Object.entries(split).map(([barangayId, kw]) => ({
    barangayId,
    targetKw: Math.round(kw * 100) / 100,
  }));

export interface CreateAlertResult {
  alert: AlertRow;
  /** False when an Idempotency-Key matched an alert that already exists (nothing new sent). */
  created: boolean;
}

/**
 * FR-API-10, 11. Stores the alert with sender and time, resolves "all pilot areas" to the actual
 * barangay list and stores it, splits the target by opted-in households, and returns the alert. The
 * caller dispatches the push after responding.
 */
export async function createAlert(
  db: Db,
  input: CreateAlertInput,
  opts: { createdBy: string; idempotencyKey: string | null; isDemo: boolean },
): Promise<CreateAlertResult> {
  if (opts.idempotencyKey) {
    const existing = await findAlertByIdempotencyKey(db, opts.idempotencyKey, opts.isDemo);
    if (existing) return { alert: existing, created: false };
  }

  const start = Date.parse(input.windowStart);
  const end = Date.parse(input.windowEnd);
  if ((end - start) / HOUR_MS > MAX_WINDOW_HOURS) {
    throw new AppError(
      422,
      'window_too_long',
      `The window can be at most ${MAX_WINDOW_HOURS} hours.`,
    );
  }
  if (end <= Date.now()) {
    throw new AppError(422, 'window_in_past', 'The window has already ended.');
  }
  const sendAt = input.sendAt === undefined ? null : Date.parse(input.sendAt);
  if (sendAt !== null && sendAt <= Date.now()) {
    throw new AppError(
      422,
      'send_at_in_past',
      'The send time has already passed. Send now instead.',
    );
  }

  const requested = input.targetBarangayIds.length ? [...new Set(input.targetBarangayIds)] : null;
  const barangayIds = await existingBarangayIds(db, requested);
  if (barangayIds.length === 0 || (requested && barangayIds.length !== requested.length)) {
    throw new AppError(
      422,
      'unknown_barangay',
      'One or more target barangays are not in the pilot.',
    );
  }

  const atRisk = [...new Set(input.atRiskBarangayIds ?? [])];
  if (atRisk.some((id) => !barangayIds.includes(id))) {
    throw new AppError(
      422,
      'at_risk_not_targeted',
      'Barangays marked at risk of a brownout must also be targeted.',
    );
  }

  const shares = toShares(splitTargetKw(input.targetKw, await optedInCounts(db, barangayIds)));
  const id = crypto.randomUUID();
  try {
    await insertAlertWithTargets(
      db,
      {
        id,
        level: input.level,
        windowStart: new Date(start).toISOString(),
        windowEnd: new Date(end).toISOString(),
        targetKw: input.targetKw,
        targetBarangayIds: barangayIds,
        atRiskBarangayIds: atRisk,
        message: input.message,
        createdBy: opts.createdBy,
        idempotencyKey: opts.idempotencyKey,
        sendAt: sendAt === null ? null : new Date(sendAt).toISOString(),
      },
      shares,
    );
  } catch (err) {
    // Two identical requests raced: the other one stored the alert first. Return that one.
    if (opts.idempotencyKey && isUniqueViolation(err)) {
      const existing = await findAlertByIdempotencyKey(db, opts.idempotencyKey, opts.isDemo);
      if (existing) return { alert: existing, created: false };
    }
    throw err;
  }
  const alert = await getAlert(db, id, opts.isDemo);
  if (!alert) throw new Error('alert vanished after insert');
  return { alert, created: true };
}

export async function getAlertView(db: Db, id: string, isDemo: boolean): Promise<AlertView> {
  const alert = await getAlert(db, id, isDemo);
  if (!alert) throw notFound('Alert');
  return toAlertView(alert);
}

/**
 * FR-APP-06: the alert a household should see (one that targets its barangay), or for the
 * dashboard (no household) the newest open alert.
 */
export async function activeAlert(
  db: Db,
  householdId: string | null,
  isDemo: boolean,
): Promise<AlertView | null> {
  let barangayId: string | null = null;
  if (householdId) {
    const profile = await getHouseholdProfile(db, householdId);
    if (!profile) throw notFound('Household');
    barangayId = profile.barangayId;
  }
  const alert = await findOpenAlert(db, barangayId, isDemo);
  return alert ? toAlertView(alert) : null;
}

export async function alertLog(db: Db, limit: number, isDemo: boolean): Promise<AlertView[]> {
  return (await listAlerts(db, limit, isDemo)).map(toAlertView);
}

/** FR-API-11: operator override of barangay shares, while the alert is still open. */
export async function updateTargets(
  db: Db,
  alertId: string,
  input: UpdateTargetsInput,
  isDemo: boolean,
): Promise<AlertTargetsResponse> {
  const alert = await getAlert(db, alertId, isDemo);
  if (!alert) throw notFound('Alert');
  if (['settling', 'settled', 'cancelled'].includes(alert.storedStatus)) {
    throw new AppError(409, 'alert_closed', 'This alert can no longer be changed.');
  }
  const wanted = [...new Map(input.targets.map((t) => [t.barangayId, t])).values()];
  const outside = wanted.filter((t) => !alert.targetBarangayIds.includes(t.barangayId));
  if (outside.length) {
    throw new AppError(422, 'not_targeted', 'Only barangays this alert targets can be changed.');
  }
  const updated = await overrideAlertTargets(db, alertId, wanted);
  if (updated.length !== wanted.length) {
    throw new AppError(409, 'alert_closed', 'This alert can no longer be changed.');
  }
  return { targets: await listAlertTargets(db, alertId) };
}

/**
 * Demo only: "Measure (fast-forward)". Moves the alert's clock forward to window start (commits
 * close, before photos open) or window end (after photos open, simulated readings can be sent).
 * Never moves backwards and is idempotent, so a double click does nothing extra. Settlement is a
 * separate call.
 */
export async function fastForward(
  db: Db,
  alertId: string,
  to: 'window_start' | 'window_end',
  isDemo: boolean,
): Promise<AlertView> {
  const alert = await getAlert(db, alertId, isDemo);
  if (!alert) throw notFound('Alert');
  if (!(await fastForwardAlert(db, alertId, to))) {
    throw new AppError(409, 'alert_closed', 'This alert is closed.');
  }
  return getAlertView(db, alertId, isDemo);
}
