import { countSimulated, deleteSimulated, getAlert, listBarangays, type Db } from '@kapitwatt/db';
import type { SimParams, SimRunInput, SimRunSummary, SimStatus } from '@kapitwatt/shared';
import { buildLagunaSeed, DEFAULT_PARAMS, runCommits, runDelivery } from '@kapitwatt/sim';
import { AppError, conflict, notFound } from '../lib/errors';
import { logInfo } from '../lib/log';
import { deliverDemoSmartMeters } from './demo';
import { registerSimulated } from './households';
import { createSimPort } from './sim-port';

const MIN_MS = 60_000;

/** GET /sim/status. The routes only exist in the demo environment, so `enabled` is always true here. */
export async function simStatus(db: Db): Promise<SimStatus> {
  const counts = await countSimulated(db);
  return {
    enabled: true,
    simulatedHouseholds: counts.total,
    amiHouseholds: counts.ami,
    photoHouseholds: counts.photo,
    defaults: DEFAULT_PARAMS,
  };
}

/**
 * POST /sim/seed: about 1,200 simulated households across the 21 pilot barangays, through the
 * simulated registration path. Refuses to seed twice: reset first, so counts stay what the plan says.
 */
export async function seedSimulation(
  db: Db,
  params: Pick<SimParams, 'amiShare' | 'seed'>,
): Promise<SimStatus> {
  if ((await countSimulated(db)).total > 0) {
    throw conflict('already_seeded', 'Simulated households already exist. Reset first.');
  }
  const seed = buildLagunaSeed(params);
  const ids = new Map((await listBarangays(db)).map((b) => [`${b.municipality}|${b.name}`, b.id]));
  const missing = seed.barangays.filter((b) => !ids.has(`${b.municipality}|${b.name}`));
  if (missing.length) {
    throw conflict(
      'barangays_missing',
      `${missing.length} pilot barangays are not in the database. Run pnpm db:seed first.`,
    );
  }
  const inserted = await registerSimulated(
    db,
    params.seed,
    seed.households.map((h) => ({
      barangayId: ids.get(`${h.barangay.municipality}|${h.barangay.name}`)!,
      meterType: h.meterType,
      meterSerial: h.meterSerial,
      billAvgKwhMonth: h.billAvgKwhMonth,
      baselineKw: h.baselineKw,
    })),
  );
  logInfo('sim_seeded', { households: inserted, amiShare: params.amiShare, seed: params.seed });
  return simStatus(db);
}

/** POST /sim/reset: deletes simulated households and, by cascade, everything they did. */
export async function resetSimulation(db: Db): Promise<SimStatus> {
  const removed = await deleteSimulated(db);
  logInfo('sim_reset', { households: removed });
  return simStatus(db);
}

/**
 * POST /sim/run, one phase per call:
 *   commit   while commits are open (before window start), paced over params.paceSeconds;
 *   deliver  after the window has ended (use Measure / fast-forward in the demo): meter readings.
 * Settlement is not run here; simulated and real commitments settle the same way.
 */
export async function runSimulation(
  db: Db,
  input: SimRunInput,
  isDemo: boolean,
): Promise<SimRunSummary> {
  const alert = await getAlert(db, input.alertId, isDemo);
  if (!alert) throw notFound('Alert');
  if (['settling', 'settled', 'cancelled'].includes(alert.storedStatus)) {
    throw conflict('alert_closed', 'This alert is closed.');
  }
  const window = { start: alert.windowStart, end: alert.windowEnd };
  const port = createSimPort(db, window, isDemo);

  if (input.phase === 'commit') {
    if (alert.effectiveNow >= alert.windowStart) {
      throw conflict('window_closed', 'Commitments closed when the peak window started.');
    }
    const summary = await runCommits(alert.id, input.params, port);
    logInfo('sim_commits', {
      alertId: alert.id,
      committed: summary.committed,
      kw: summary.committedKw,
    });
    return summary;
  }

  if (alert.effectiveNow < alert.windowEnd) {
    throw new AppError(
      409,
      'window_open',
      'Readings are sent after the window ends. Use Measure (fast-forward) first.',
    );
  }
  const windowMinutes = (alert.windowEnd.getTime() - alert.windowStart.getTime()) / MIN_MS;
  const summary = await runDelivery(alert.id, input.params, port, windowMinutes);
  // Demo accounts commit on testers' phones; the fake smart-meter feed stands in for their meters.
  const demoMeters = await deliverDemoSmartMeters(db, alert.id, window, input.params.followThrough);
  logInfo('sim_delivery', {
    alertId: alert.id,
    households: summary.householdsWithReadings,
    demoMeters,
  });
  return summary;
}
