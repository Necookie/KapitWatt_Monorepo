import { capKw, type SimParams, type SimRunSummary } from '@kapitwatt/shared';
import { createRng } from './rng';

/**
 * Event runner. The simulator is a backend data generator that runs REAL logic:
 * it never inserts rows itself. apps/api hands it this port, whose methods are
 * the same service functions real phones hit (commit, submit reading, AMI feed).
 * It acts as a service account for simulated rows only, never a superadmin.
 *
 * Every write is a batch: on Workers each query is one subrequest, so one call
 * per household would not fit in a request.
 */
export interface SimPort {
  /**
   * Simulated households in the alert's target barangays, with any commitment
   * they already hold for this alert.
   */
  listSimulatedHouseholds(alertId: string): Promise<SimHousehold[]>;
  /** Same rules as a household commit (cap, cutoff, one per alert). Rejected ones are skipped. */
  commitBatch(alertId: string, commits: SimCommit[]): Promise<void>;
  /**
   * Meter readings for committed households, flagged simulated. `atMinute` is the
   * capture time as an offset from window start; the port turns it into `captured_at`
   * (the one place the simulator, as a service account, supplies a timestamp).
   */
  submitReadingsBatch(alertId: string, items: SimHouseholdReadings[]): Promise<void>;
  /** Waits between paced commits. Injected so tests can run instantly. */
  sleep(ms: number): Promise<void>;
}

export interface SimHousehold {
  id: string;
  barangayId: string;
  meterType: 'ami' | 'standard';
  baselineKw: number;
  billAvgKwhMonth: number;
  lastReadingKwh: number;
  /** kW already committed to this alert, or null. */
  committedKw: number | null;
}

export interface SimCommit {
  householdId: string;
  committedKw: number;
}

export interface SimReading {
  kind: 'before' | 'after';
  readingKwh: number;
  /** Offset from window start, in minutes. */
  atMinute: number;
}

export interface SimHouseholdReadings {
  householdId: string;
  readings: SimReading[];
}

const READINGS_BATCH = 200;
const round1 = (n: number): number => Math.round(n * 10) / 10;

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const byId = (a: SimHousehold, b: SimHousehold): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Participation rate per barangay: `participation` times a seeded multiplier in
 * 1 +/- `barangaySpread`, normalised so the household-weighted mean is unchanged.
 * Without the spread every barangay lands on the same percentage of its target.
 */
export function barangayParticipation(
  householdsByBarangay: ReadonlyMap<string, number>,
  params: Pick<SimParams, 'participation' | 'barangaySpread'>,
  rng: () => number,
): Map<string, number> {
  const ids = [...householdsByBarangay.keys()].sort();
  const raw = ids.map(() => 1 + params.barangaySpread * (2 * rng() - 1));
  let total = 0;
  let weighted = 0;
  ids.forEach((id, i) => {
    const n = householdsByBarangay.get(id) ?? 0;
    total += n;
    weighted += n * raw[i]!;
  });
  const mean = total === 0 ? 1 : weighted / total;
  const out = new Map<string, number>();
  ids.forEach((id, i) => {
    out.set(id, Math.min(1, Math.max(0, (params.participation * raw[i]!) / mean)));
  });
  return out;
}

function summarise(
  phase: SimRunSummary['phase'],
  households: readonly SimHousehold[],
  householdsWithReadings: number,
): SimRunSummary {
  const committed = households.filter((h) => h.committedKw !== null);
  return {
    phase,
    households: households.length,
    committed: committed.length,
    committedKw: round1(committed.reduce((sum, h) => sum + (h.committedKw ?? 0), 0)),
    householdsWithReadings,
  };
}

/**
 * Phase 1, while the alert is open: a seeded share of households in each barangay
 * commits `cutKw`, in batches spread over `paceSeconds` so the live total rises gradually.
 * Households that already hold a commitment are left alone, so a second call adds nothing.
 */
export async function runCommits(
  alertId: string,
  params: SimParams,
  port: SimPort,
): Promise<SimRunSummary> {
  const households = (await port.listSimulatedHouseholds(alertId)).sort(byId);
  const rng = createRng(params.seed);

  const groups = new Map<string, SimHousehold[]>();
  for (const h of households) {
    const group = groups.get(h.barangayId);
    if (group) group.push(h);
    else groups.set(h.barangayId, [h]);
  }
  const rates = barangayParticipation(
    new Map([...groups].map(([id, group]) => [id, group.length])),
    params,
    rng,
  );

  const picked: SimCommit[] = [];
  for (const barangayId of [...groups.keys()].sort()) {
    const group = groups.get(barangayId)!;
    const count = Math.round(group.length * (rates.get(barangayId) ?? 0));
    // Households already committed count toward the barangay's share, so a second
    // run (even with another seed) tops up to the rate instead of adding a new subset.
    const open = group.filter((h) => h.committedKw === null);
    const missing = Math.max(0, count - (group.length - open.length));
    for (const h of shuffle(open, rng).slice(0, missing)) {
      // Never ask for more than the bill cap allows, the same limit a phone is held to.
      const committedKw = Math.min(params.cutKw, Math.floor(capKw(h.billAvgKwhMonth) * 10) / 10);
      if (committedKw > 0) picked.push({ householdId: h.id, committedKw });
    }
  }

  // Mix the barangays so the total rises evenly across towns, then pace about one batch a second.
  const queue = shuffle(picked, rng);
  const ticks = Math.max(1, Math.round(params.paceSeconds));
  const perTick = Math.max(1, Math.ceil(queue.length / ticks));
  for (let i = 0; i < queue.length; i += perTick) {
    if (i > 0) await port.sleep((params.paceSeconds * 1000) / ticks);
    await port.commitBatch(alertId, queue.slice(i, i + perTick));
  }

  // Read the commitments back: a commit can be refused (window opened mid-run, cap),
  // and the summary must report what was accepted, not what was attempted.
  return summarise('commit', await port.listSimulatedHouseholds(alertId), 0);
}

/**
 * Phase 2, after the window has ended: the fake meter feed. Each committed household
 * delivers `followThrough` of its cut against a baseline that is off by up to
 * `baselineNoise`.
 *  - Smart-meter households: the AMI register at window start and window end.
 *  - Photo households: a before reading a few minutes into the window and an after
 *    reading a few minutes past its end. `1 - photoCompletion` of them miss a photo
 *    and so earn nothing.
 * Settlement is NOT done here; the API settles simulated and real rows the same way.
 */
export async function runDelivery(
  alertId: string,
  params: SimParams,
  port: SimPort,
  windowMinutes: number,
): Promise<SimRunSummary> {
  const households = (await port.listSimulatedHouseholds(alertId)).sort(byId);
  // Its own stream, so delivery does not depend on how many draws the commit phase made.
  const rng = createRng(params.seed ^ 0x5bd1e995);

  const items: SimHouseholdReadings[] = [];
  for (const h of households) {
    if (h.committedKw === null) continue;
    const noise = (2 * rng() - 1) * params.baselineNoise;
    const actualKw = Math.max(
      0.1,
      h.baselineKw * (1 + noise) - h.committedKw * params.followThrough,
    );

    if (h.meterType === 'ami') {
      items.push({
        householdId: h.id,
        readings: [
          { kind: 'before', readingKwh: round1(h.lastReadingKwh), atMinute: 0 },
          {
            kind: 'after',
            readingKwh: round1(h.lastReadingKwh + (actualKw * windowMinutes) / 60),
            atMinute: windowMinutes,
          },
        ],
      });
      continue;
    }

    const completes = rng() < params.photoCompletion;
    const beforeMinute = Math.round(1 + rng() * 11);
    const afterMinute = windowMinutes + Math.round(2 + rng() * 20);
    const before = round1(h.lastReadingKwh + 0.1);
    const after = round1(before + (actualKw * (afterMinute - beforeMinute)) / 60);
    if (completes) {
      items.push({
        householdId: h.id,
        readings: [
          { kind: 'before', readingKwh: before, atMinute: beforeMinute },
          { kind: 'after', readingKwh: after, atMinute: afterMinute },
        ],
      });
    } else if (rng() < 0.5) {
      // Took the before photo, then missed the after deadline.
      items.push({
        householdId: h.id,
        readings: [{ kind: 'before', readingKwh: before, atMinute: beforeMinute }],
      });
    }
    // Otherwise: no photos at all.
  }

  for (let i = 0; i < items.length; i += READINGS_BATCH) {
    await port.submitReadingsBatch(alertId, items.slice(i, i + READINGS_BATCH));
  }
  return summarise('deliver', households, items.length);
}

/** Both phases back to back. For tests and scripts; the demo runs them as two calls. */
export async function runEvent(
  alertId: string,
  params: SimParams,
  port: SimPort,
  windowMinutes: number,
): Promise<SimRunSummary> {
  await runCommits(alertId, params, port);
  return runDelivery(alertId, params, port, windowMinutes);
}
