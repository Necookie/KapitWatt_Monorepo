import type { SettlementCommitmentRow } from '@kapitwatt/db';
import { roundKw, type SimParams } from '@kapitwatt/shared';
import { runCommits, runDelivery, type SimHousehold, type SimPort } from '@kapitwatt/sim';
import { commitCapKw } from './cap';
import { computeSettlement } from './settlement';
import { registerPairToIntervals, simPhotoReadings, type SimWindow } from './sim-port';

/**
 * Demo only: what a live simulator run would deliver, per barangay, without writing anything. It runs
 * the real runner against an in-memory port that applies the same rules as the database path: the
 * commit cap (trust included), the photo checks the sim port applies, the smart-meter interval split,
 * and the settlement math. `pnpm demo:seed-search` uses it to pick a seed where the presenter's
 * barangay reaches its target from simulated households alone; testers' commitments only add to that.
 */

const HOUR_MS = 3_600_000;

export interface ForecastHousehold extends Omit<SimHousehold, 'committedKw'> {
  trustScore: number;
}

export interface BarangayForecast {
  barangayId: string;
  targetKw: number;
  deliveredKw: number;
  /** delivered / target. */
  progress: number;
}

export interface LiveForecast {
  targetKw: number;
  committedKw: number;
  deliveredKw: number;
  barangays: BarangayForecast[];
}

export async function forecastLiveEvent(
  households: readonly ForecastHousehold[],
  targets: readonly { barangayId: string; targetKw: number }[],
  params: SimParams,
  window: SimWindow,
): Promise<LiveForecast> {
  const targeted = new Set(targets.map((t) => t.barangayId));
  const pool = households.filter((h) => targeted.has(h.barangayId));
  const byId = new Map(pool.map((h) => [h.id, h]));
  const committed = new Map<string, number>();
  const rows = new Map<string, SettlementCommitmentRow>();
  const windowMinutes = (window.end.getTime() - window.start.getTime()) / 60_000;

  const port: SimPort = {
    listSimulatedHouseholds: async () =>
      pool.map((h) => ({
        id: h.id,
        barangayId: h.barangayId,
        meterType: h.meterType,
        baselineKw: h.baselineKw,
        billAvgKwhMonth: h.billAvgKwhMonth,
        lastReadingKwh: h.lastReadingKwh,
        committedKw: committed.get(h.id) ?? null,
      })),
    commitBatch: async (_alertId, commits) => {
      for (const c of commits) {
        const h = byId.get(c.householdId);
        if (!h || committed.has(h.id)) continue;
        const cap = commitCapKw(h.baselineKw, h.billAvgKwhMonth, h.trustScore) ?? 0;
        if (c.committedKw <= 0 || c.committedKw > cap + 1e-9) continue;
        committed.set(h.id, c.committedKw);
        rows.set(h.id, {
          id: h.id,
          householdId: h.id,
          barangayId: h.barangayId,
          path: h.meterType === 'ami' ? 'ami' : 'photo',
          committedKw: c.committedKw,
          baselineKw: h.baselineKw,
          billAvgKwhMonth: h.billAvgKwhMonth,
          before: null,
          after: null,
          amiKwh: 0,
          amiIntervals: 0,
        });
      }
    },
    submitReadingsBatch: async (_alertId, items) => {
      for (const item of items) {
        const h = byId.get(item.householdId);
        const row = rows.get(item.householdId);
        if (!h || !row) continue;
        if (row.path === 'ami') {
          const before = item.readings.find((r) => r.kind === 'before');
          const after = item.readings.find((r) => r.kind === 'after');
          if (!before || !after) continue;
          const intervals = registerPairToIntervals(
            h.id,
            window,
            before.readingKwh,
            after.readingKwh,
          );
          row.amiIntervals = intervals.length;
          row.amiKwh = intervals.reduce((sum, i) => sum + i.kwh, 0);
          continue;
        }
        for (const r of simPhotoReadings(h, window, item.readings)) {
          const reading = {
            kwh: r.readingKwh,
            at: new Date(r.capturedAt),
            status: r.checkStatus,
            flags: r.flags,
          };
          if (r.kind === 'before') row.before = reading;
          else if (r.kind === 'after') row.after = reading;
        }
      }
    },
    sleep: async () => {},
  };

  const quick = { ...params, paceSeconds: 0 };
  await runCommits('forecast', quick, port);
  await runDelivery('forecast', quick, port, windowMinutes);

  const windowHours = (window.end.getTime() - window.start.getTime()) / HOUR_MS;
  const { results } = computeSettlement([...rows.values()], [...targets], windowHours);
  const delivered = new Map<string, number>();
  for (const r of results) {
    if (r.status !== 'verified') continue;
    const barangayId = rows.get(r.householdId)!.barangayId;
    delivered.set(barangayId, (delivered.get(barangayId) ?? 0) + r.verifiedKwh / windowHours);
  }
  const barangays = targets.map((t) => {
    const deliveredKw = roundKw(delivered.get(t.barangayId) ?? 0);
    return {
      barangayId: t.barangayId,
      targetKw: t.targetKw,
      deliveredKw,
      progress: t.targetKw > 0 ? deliveredKw / t.targetKw : 0,
    };
  });
  return {
    targetKw: roundKw(targets.reduce((sum, t) => sum + t.targetKw, 0)),
    committedKw: roundKw([...committed.values()].reduce((a, b) => a + b, 0)),
    deliveredKw: roundKw(barangays.reduce((sum, b) => sum + b.deliveredKw, 0)),
    barangays,
  };
}
