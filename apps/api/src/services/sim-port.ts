import {
  insertSimAmiIntervals,
  insertSimPhotoReadings,
  listSimHouseholdsForAlert,
  type Db,
  type SimPhotoReading,
} from '@kapitwatt/db';
import { AMI_INTERVAL_MIN } from '@kapitwatt/shared';
import type { SimHousehold, SimHouseholdReadings, SimPort } from '@kapitwatt/sim';
import { commitMany } from './commit';
import { evaluatePhotoReading } from './reading-checks';

const MIN_MS = 60_000;

export interface SimWindow {
  start: Date;
  end: Date;
}

/**
 * Turns a smart-meter register pair (window start, window end) into the 5-minute interval energy the
 * AMI feed would deliver, spread evenly. AMI data lives in ami_intervals, not meter_readings.
 */
export function registerPairToIntervals(
  householdId: string,
  window: SimWindow,
  startKwh: number,
  endKwh: number,
): { householdId: string; intervalStart: string; kwh: number }[] {
  const minutes = (window.end.getTime() - window.start.getTime()) / MIN_MS;
  const n = Math.floor(minutes / AMI_INTERVAL_MIN);
  if (n <= 0 || endKwh < startKwh) return [];
  const each = Math.round(((endKwh - startKwh) / n) * 1000) / 1000;
  return Array.from({ length: n }, (_, k) => ({
    householdId,
    intervalStart: new Date(window.start.getTime() + k * AMI_INTERVAL_MIN * MIN_MS).toISOString(),
    kwh: each,
  }));
}

/**
 * Photo-path readings judged by the same rules as a phone's (timing, value vs previous). The
 * capture time is window start plus the runner's minute offset: the one place the simulator, as a
 * service account, supplies a timestamp. There is no photo and no GPS, so those checks don't apply.
 */
export function simPhotoReadings(
  h: Pick<SimHousehold, 'id' | 'billAvgKwhMonth'>,
  window: SimWindow,
  readings: SimHouseholdReadings['readings'],
): SimPhotoReading[] {
  const sorted = [...readings].sort((a, b) => a.atMinute - b.atMinute);
  const out: SimPhotoReading[] = [];
  let previous: { kwh: number; at: Date } | null = null;
  for (const r of sorted) {
    const capturedAt = new Date(window.start.getTime() + r.atMinute * MIN_MS);
    const { checkStatus, flags } = evaluatePhotoReading({
      kind: r.kind,
      readingKwh: r.readingKwh,
      capturedAt,
      window,
      previous,
      billAvgKwhMonth: h.billAvgKwhMonth,
      gps: null,
    });
    out.push({
      householdId: h.id,
      kind: r.kind,
      readingKwh: r.readingKwh,
      capturedAt: capturedAt.toISOString(),
      checkStatus,
      flags,
    });
    previous = { kwh: r.readingKwh, at: capturedAt };
  }
  return out;
}

/**
 * SimPort on top of the real services (architecture rule 2): commits go through commitMany (the
 * commit rules and the guarded insert), readings through the reading checks. Every query is limited
 * to simulated households. One port per run.
 */
export function createSimPort(db: Db, window: SimWindow, isDemo: boolean): SimPort {
  const known = new Map<string, SimHousehold>();
  return {
    async listSimulatedHouseholds(alertId) {
      const rows = await listSimHouseholdsForAlert(db, alertId);
      known.clear();
      for (const r of rows) known.set(r.id, r);
      return rows;
    },
    async commitBatch(alertId, commits) {
      await commitMany(db, alertId, commits, isDemo);
    },
    async submitReadingsBatch(alertId, items) {
      const photo: SimPhotoReading[] = [];
      const intervals: ReturnType<typeof registerPairToIntervals> = [];
      for (const item of items) {
        const h = known.get(item.householdId);
        if (!h) continue;
        if (h.meterType === 'ami') {
          const before = item.readings.find((r) => r.kind === 'before');
          const after = item.readings.find((r) => r.kind === 'after');
          if (before && after) {
            intervals.push(
              ...registerPairToIntervals(h.id, window, before.readingKwh, after.readingKwh),
            );
          }
        } else {
          photo.push(...simPhotoReadings(h, window, item.readings));
        }
      }
      await insertSimPhotoReadings(db, alertId, photo);
      await insertSimAmiIntervals(db, alertId, intervals);
    },
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
}
