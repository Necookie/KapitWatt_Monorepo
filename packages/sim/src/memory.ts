import {
  PILOT_BARANGAYS,
  actualKwFromReadings,
  barangayTargetHit,
  capKw,
  roundKw,
  splitTargetKw,
  verifyCut,
  type Alert,
  type AlertTarget,
  type AlertTotals,
  type BarangayTotals,
  type BarangayWithCount,
  type CreateAlertInput,
  type FastForwardInput,
  type MeterType,
  type SimParams,
  type SimRunSummary,
  type SimStatus,
  type UpdateTargetsInput,
} from '@kapitwatt/shared';
import { DEFAULT_PARAMS } from './presets';
import { createRng } from './rng';
import {
  runCommits,
  runDelivery,
  type SimCommit,
  type SimHousehold,
  type SimHouseholdReadings,
  type SimPort,
  type SimReading,
} from './runner';
import { buildLagunaSeed } from './seed';

/**
 * An in-memory stand-in for the API, for two jobs:
 *  1. the simulator's own tests (a full event without a database), and
 *  2. the dashboard's fixture mode, so screens can be built before the endpoints exist.
 *
 * It follows the same rules as the real services (target split, commit cutoff and cap,
 * one reading per kind, payout math from @kapitwatt/shared) but it is NOT the API:
 * no push, no photo checks, no rewards table. Nothing here is used in the deployed demo.
 */

// The package compiles without DOM or Node typings; both runtimes provide this.
declare function setTimeout(callback: () => void, ms: number): unknown;

interface MemHousehold {
  id: string;
  barangayId: string;
  meterType: MeterType;
  billAvgKwhMonth: number;
  baselineKw: number;
  lastReadingKwh: number;
  isSimulated: boolean;
}

interface MemCommitment {
  householdId: string;
  barangayId: string;
  path: 'ami' | 'photo';
  committedKw: number;
  baselineKw: number;
  readings: Partial<Record<SimReading['kind'], SimReading>>;
  /** Verified cut, once both readings are in. */
  paidCutKw: number | null;
}

interface MemAlert {
  alert: Alert;
  windowMinutes: number;
  targetByBarangay: Record<string, number>;
  /** Barangays whose share the operator has set by hand. */
  overrides: Set<string>;
  commitments: Map<string, MemCommitment>;
}

export interface MemoryBackendOptions {
  /** Defaults to a real timer. Tests pass an instant one. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => Date;
}

export class MemoryBackendError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const pseudoUuid = (n: number): string =>
  `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;

export class MemoryBackend {
  private nextId = 1;
  private readonly barangays: BarangayWithCount[] = [];
  private readonly households = new Map<string, MemHousehold>();
  private readonly alerts: MemAlert[] = [];
  /** Alerts before this index predate the last reset and are no longer "current". */
  private currentFrom = 0;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => Date;

  constructor(options: MemoryBackendOptions = {}) {
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.now = options.now ?? (() => new Date());
    // Reference data, like `pnpm db:seed`: present before any household exists.
    for (const [municipality, names] of Object.entries(PILOT_BARANGAYS)) {
      for (const name of names) {
        this.barangays.push({ id: this.id(), name, municipality, feederId: null });
      }
    }
  }

  private id(): string {
    return pseudoUuid(this.nextId++);
  }

  private find(alertId: string): MemAlert {
    const found = this.alerts.find((a) => a.alert.id === alertId);
    if (!found) throw new MemoryBackendError(404, 'alert not found');
    return found;
  }

  // --- barangays -----------------------------------------------------------

  listBarangays(): BarangayWithCount[] {
    const counts = new Map<string, number>();
    for (const h of this.households.values()) {
      counts.set(h.barangayId, (counts.get(h.barangayId) ?? 0) + 1);
    }
    return this.barangays.map((b) => ({ ...b, optedInHouseholds: counts.get(b.id) ?? 0 }));
  }

  // --- simulator routes ----------------------------------------------------

  /** POST /sim/seed. Re-seeding replaces the simulated households. */
  seed(params: Pick<SimParams, 'amiShare' | 'seed'>): SimStatus {
    this.reset();
    const rng = createRng(params.seed ^ 0x2545f491);
    const idByKey = new Map(this.barangays.map((b) => [`${b.municipality}/${b.name}`, b.id]));
    for (const h of buildLagunaSeed(params).households) {
      const barangayId = idByKey.get(`${h.barangay.municipality}/${h.barangay.name}`);
      if (!barangayId) continue;
      const id = this.id();
      this.households.set(id, {
        id,
        barangayId,
        meterType: h.meterType,
        billAvgKwhMonth: h.billAvgKwhMonth,
        baselineKw: h.baselineKw,
        lastReadingKwh: Math.round((1000 + rng() * 8000) * 10) / 10,
        isSimulated: true,
      });
    }
    return this.status();
  }

  /**
   * POST /sim/reset. Deletes simulated households and, by cascade, their commitments.
   * An alert that has not settled is cancelled, and earlier alerts stop being "current",
   * so the overview returns to 0 kW committed with no alert in force.
   */
  reset(): SimStatus {
    for (const [id, h] of this.households) {
      if (h.isSimulated) this.households.delete(id);
    }
    for (const a of this.alerts) {
      for (const [householdId] of a.commitments) {
        if (!this.households.has(householdId)) a.commitments.delete(householdId);
      }
      if (a.alert.status !== 'settled') {
        a.alert = { ...a.alert, status: 'cancelled', cancelledAt: this.now().toISOString() };
      }
    }
    this.currentFrom = this.alerts.length;
    return this.status();
  }

  /** GET /sim/status. */
  status(): SimStatus {
    const simulated = [...this.households.values()].filter((h) => h.isSimulated);
    const ami = simulated.filter((h) => h.meterType === 'ami').length;
    return {
      enabled: true,
      simulatedHouseholds: simulated.length,
      amiHouseholds: ami,
      photoHouseholds: simulated.length - ami,
      defaults: DEFAULT_PARAMS,
    };
  }

  /** POST /sim/run. */
  async run(
    alertId: string,
    params: SimParams,
    phase: 'commit' | 'deliver',
  ): Promise<SimRunSummary> {
    const found = this.find(alertId);
    if (phase === 'deliver' && found.alert.status !== 'settling') {
      throw new MemoryBackendError(409, 'end the window before sending readings');
    }
    return phase === 'commit'
      ? runCommits(alertId, params, this.port)
      : runDelivery(alertId, params, this.port, found.windowMinutes);
  }

  // --- alerts --------------------------------------------------------------

  /** POST /alerts. An empty target list means all pilot areas. */
  createAlert(input: CreateAlertInput, createdBy = 'operator'): Alert {
    const targetIds =
      input.targetBarangayIds.length > 0
        ? input.targetBarangayIds
        : this.barangays.map((b) => b.id);
    const optedIn: Record<string, number> = {};
    for (const b of this.listBarangays()) {
      if (targetIds.includes(b.id)) optedIn[b.id] = b.optedInHouseholds ?? 0;
    }
    const start = new Date(input.windowStart);
    const end = new Date(input.windowEnd);
    const alert: Alert = {
      id: this.id(),
      level: input.level,
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      targetKw: input.targetKw,
      targetBarangayIds: targetIds,
      message: input.message,
      status: 'active',
      createdBy,
      createdAt: this.now().toISOString(),
      clockOffsetSec: 0,
      settledAt: null,
      cancelledAt: null,
      pushSentAt: null,
    };
    this.alerts.push({
      alert,
      windowMinutes: (end.getTime() - start.getTime()) / 60_000,
      targetByBarangay: splitTargetKw(input.targetKw, optedIn),
      overrides: new Set(),
      commitments: new Map(),
    });
    return alert;
  }

  /** GET /alerts: the alert log, newest first. Cancelled and pre-reset alerts stay in it. */
  listAlerts(limit = 20): Alert[] {
    return this.alerts
      .map((a) => a.alert)
      .reverse()
      .slice(0, limit);
  }

  getAlert(alertId: string): Alert {
    return this.find(alertId).alert;
  }

  /** The most recent alert since the last reset that was not cancelled, settled ones included. */
  currentAlert(): Alert | null {
    for (let i = this.alerts.length - 1; i >= this.currentFrom; i--) {
      const a = this.alerts[i]!;
      if (a.alert.status !== 'cancelled') return a.alert;
    }
    return null;
  }

  /**
   * PUT /alerts/:id/targets. Operator override of barangay shares, while the alert is
   * still open. Only the named barangays change; the alert's own target stays as sent.
   */
  updateTargets(alertId: string, targets: UpdateTargetsInput['targets']): AlertTarget[] {
    const found = this.find(alertId);
    if (['settling', 'settled', 'cancelled'].includes(found.alert.status)) {
      throw new MemoryBackendError(409, 'this alert can no longer be changed');
    }
    if (targets.some((t) => !found.alert.targetBarangayIds.includes(t.barangayId))) {
      throw new MemoryBackendError(422, 'only barangays this alert targets can be changed');
    }
    for (const t of targets) {
      found.targetByBarangay[t.barangayId] = Math.round(t.targetKw * 100) / 100;
      found.overrides.add(t.barangayId);
    }
    return this.barangays
      .filter((b) => found.alert.targetBarangayIds.includes(b.id))
      .map((b) => ({
        barangayId: b.id,
        name: b.name,
        municipality: b.municipality,
        targetKw: Math.round((found.targetByBarangay[b.id] ?? 0) * 100) / 100,
        isOverride: found.overrides.has(b.id),
      }));
  }

  /**
   * POST /alerts/:id/fast-forward. Moves the window to now and keeps its scheduled
   * length, because pay is for the scheduled window.
   */
  fastForward(alertId: string, to: FastForwardInput['to']): Alert {
    const found = this.find(alertId);
    const { status } = found.alert;
    const now = this.now().getTime();
    const span = found.windowMinutes * 60_000;
    if (to === 'window_start') {
      if (status !== 'active') throw new MemoryBackendError(409, 'window already opened');
      found.alert = {
        ...found.alert,
        status: 'window_open',
        windowStart: new Date(now).toISOString(),
        windowEnd: new Date(now + span).toISOString(),
      };
    } else {
      if (status !== 'active' && status !== 'window_open') {
        throw new MemoryBackendError(409, 'window already ended');
      }
      found.alert = {
        ...found.alert,
        status: 'settling',
        windowStart: new Date(now - span).toISOString(),
        windowEnd: new Date(now).toISOString(),
      };
    }
    return found.alert;
  }

  /**
   * POST /alerts/:id/cancel. Ends an alert early, before its window has ended; the API
   * also sends the alert-lifted push. Safe to call twice.
   */
  cancel(alertId: string): Alert {
    const found = this.find(alertId);
    const { status } = found.alert;
    if (status === 'cancelled') return found.alert;
    if (status === 'settling' || status === 'settled') {
      throw new MemoryBackendError(409, 'the window has already ended');
    }
    found.alert = { ...found.alert, status: 'cancelled', cancelledAt: this.now().toISOString() };
    return found.alert;
  }

  /** POST /alerts/:id/settle. Safe to call twice. */
  settle(alertId: string): Alert {
    const found = this.find(alertId);
    if (found.alert.status === 'settled') return found.alert;
    if (found.alert.status !== 'settling') {
      throw new MemoryBackendError(409, 'end the window before settling');
    }
    found.alert = { ...found.alert, status: 'settled', settledAt: this.now().toISOString() };
    return found.alert;
  }

  /** GET /alerts/:id/totals. */
  totals(alertId: string): AlertTotals {
    const found = this.find(alertId);
    const rows = new Map<string, BarangayTotals>();
    for (const b of this.listBarangays()) {
      if (!found.alert.targetBarangayIds.includes(b.id)) continue;
      rows.set(b.id, {
        barangayId: b.id,
        name: b.name,
        municipality: b.municipality,
        targetKw: found.targetByBarangay[b.id] ?? 0,
        committedKw: 0,
        deliveredKw: 0,
        targetHit: false,
        households: b.optedInHouseholds ?? 0,
        committedHouseholds: 0,
        deliveredAmiKw: 0,
        deliveredPhotoKw: 0,
      });
    }
    for (const c of found.commitments.values()) {
      const row = rows.get(c.barangayId);
      if (!row) continue;
      row.committedKw += c.committedKw;
      row.committedHouseholds = (row.committedHouseholds ?? 0) + 1;
      if (c.paidCutKw !== null) {
        row.deliveredKw += c.paidCutKw;
        if (c.path === 'ami') row.deliveredAmiKw = (row.deliveredAmiKw ?? 0) + c.paidCutKw;
        else row.deliveredPhotoKw = (row.deliveredPhotoKw ?? 0) + c.paidCutKw;
      }
    }

    const barangays = [...rows.values()].map((row) => ({
      ...row,
      targetKw: roundKw(row.targetKw),
      committedKw: roundKw(row.committedKw),
      deliveredKw: roundKw(row.deliveredKw),
      deliveredAmiKw: roundKw(row.deliveredAmiKw ?? 0),
      deliveredPhotoKw: roundKw(row.deliveredPhotoKw ?? 0),
      targetHit: barangayTargetHit(row.deliveredKw, row.targetKw),
    }));
    const sum = (pick: (row: BarangayTotals) => number): number =>
      roundKw([...rows.values()].reduce((total, row) => total + pick(row), 0));
    return {
      alertId,
      status: found.alert.status,
      targetKw: found.alert.targetKw,
      committedKw: sum((r) => r.committedKw),
      deliveredKw: sum((r) => r.deliveredKw),
      deliveredAmiKw: sum((r) => r.deliveredAmiKw ?? 0),
      deliveredPhotoKw: sum((r) => r.deliveredPhotoKw ?? 0),
      committedHouseholds: found.commitments.size,
      barangays,
    };
  }

  // --- the port the simulator runs through ---------------------------------

  readonly port: SimPort = {
    listSimulatedHouseholds: async (alertId) => {
      const found = this.find(alertId);
      const out: SimHousehold[] = [];
      for (const h of this.households.values()) {
        if (!h.isSimulated || !found.alert.targetBarangayIds.includes(h.barangayId)) continue;
        out.push({
          id: h.id,
          barangayId: h.barangayId,
          meterType: h.meterType,
          baselineKw: h.baselineKw,
          billAvgKwhMonth: h.billAvgKwhMonth,
          lastReadingKwh: h.lastReadingKwh,
          committedKw: found.commitments.get(h.id)?.committedKw ?? null,
        });
      }
      return out;
    },
    commitBatch: async (alertId, commits) => {
      for (const c of commits) this.commit(alertId, c);
    },
    submitReadingsBatch: async (alertId, items) => {
      for (const item of items) this.submitReadings(alertId, item);
    },
    sleep: (ms) => this.sleep(ms),
  };

  /** One commitment per household per alert, before window start, within the bill cap. */
  private commit(alertId: string, c: SimCommit): boolean {
    const found = this.find(alertId);
    const h = this.households.get(c.householdId);
    if (!h || found.alert.status !== 'active') return false;
    if (!found.alert.targetBarangayIds.includes(h.barangayId)) return false;
    if (found.commitments.has(h.id) || c.committedKw > capKw(h.billAvgKwhMonth)) return false;
    found.commitments.set(h.id, {
      householdId: h.id,
      barangayId: h.barangayId,
      path: h.meterType === 'ami' ? 'ami' : 'photo',
      committedKw: c.committedKw,
      baselineKw: h.baselineKw,
      readings: {},
      paidCutKw: null,
    });
    return true;
  }

  /** One reading per kind (no resubmission). A cut is verified once both readings are in. */
  private submitReadings(alertId: string, item: SimHouseholdReadings): void {
    const found = this.find(alertId);
    const commitment = found.commitments.get(item.householdId);
    const h = this.households.get(item.householdId);
    // Readings only count once the window has ended and before results are final.
    if (!commitment || !h || found.alert.status !== 'settling') return;
    for (const reading of item.readings) {
      if (!commitment.readings[reading.kind]) commitment.readings[reading.kind] = reading;
    }
    const { before, after } = commitment.readings;
    if (!before || !after || after.atMinute <= before.atMinute) return;
    const actualKw = actualKwFromReadings(
      before.readingKwh,
      after.readingKwh,
      (after.atMinute - before.atMinute) / 60,
    );
    commitment.paidCutKw = verifyCut({
      baselineKw: commitment.baselineKw,
      actualKw,
      committedKw: commitment.committedKw,
      billAvgKwhMonth: h.billAvgKwhMonth,
      windowHours: found.windowMinutes / 60,
    }).paidCutKw;
    h.lastReadingKwh = after.readingKwh;
  }
}
