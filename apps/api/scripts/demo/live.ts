/**
 * The live event on stage, and how to forecast it from the database. Demo only.
 *
 * The presenter sends an alert to all pilot areas for LIVE_EVENT.targetKw over LIVE_EVENT.hours, then
 * runs the simulator with seed LIVE_EVENT.seed (Simulator > Realism > Random seed). Testers commit on
 * their phones; the simulator never commits for demo accounts in a live event.
 * `pnpm demo:seed-search` picks the seed; re-run it whenever the reset's data changes.
 */
import { listBarangays, optedInCounts, type Db } from '@kapitwatt/db';
import { DEMO_BARANGAY } from './accounts';
import { HUB_TOWN, SimParams, splitTargetKw } from '@kapitwatt/shared';
import {
  forecastLiveEvent,
  type ForecastHousehold,
  type LiveForecast,
} from '../../src/services/demo-forecast';

export const LIVE_EVENT = {
  targetKw: 600,
  hours: 2,
  /** Chosen by `pnpm demo:seed-search` against the data `pnpm demo:reset` leaves. */
  seed: 671,
} as const;

export interface ForecastInputs {
  households: ForecastHousehold[];
  targets: { barangayId: string; targetKw: number }[];
  heroBarangayId: string;
  names: Map<string, string>;
}

/** Everything a forecast needs, read once: simulated households and the live alert's target split. */
export async function loadForecastInputs(db: Db): Promise<ForecastInputs> {
  const barangays = await listBarangays(db);
  const hero = barangays.find((b) => b.municipality === HUB_TOWN && b.name === DEMO_BARANGAY);
  if (!hero) throw new Error(`${DEMO_BARANGAY} is not seeded`);
  const ids = barangays.map((b) => b.id);
  const split = splitTargetKw(LIVE_EVENT.targetKw, await optedInCounts(db, ids));
  // Same rounding as the alert's stored shares (services/alerts.ts).
  const targets = ids.map((id) => ({
    barangayId: id,
    targetKw: Math.round((split[id] ?? 0) * 100) / 100,
  }));
  // Same rows as listSimHouseholdsForAlert, for every barangay, plus the trust score for the cap.
  const rows = await db`
    select h.id, h.barangay_id, h.meter_type, h.baseline_kw, h.bill_avg_kwh_month, h.trust_score,
           coalesce(last.reading_kwh, 1000 + h.bill_avg_kwh_month * 6) as last_reading
    from households h
    left join lateral (
      select m.reading_kwh from meter_readings m
      where m.household_id = h.id order by m.captured_at desc limit 1
    ) last on true
    where h.is_simulated and h.opted_in and h.baseline_kw is not null`;
  return {
    households: rows.map((r) => ({
      id: r.id as string,
      barangayId: r.barangay_id as string,
      meterType: r.meter_type as 'ami' | 'standard',
      baselineKw: Number(r.baseline_kw),
      billAvgKwhMonth: Number(r.bill_avg_kwh_month),
      lastReadingKwh: Number(r.last_reading),
      trustScore: Number(r.trust_score),
    })),
    targets,
    heroBarangayId: hero.id,
    names: new Map(barangays.map((b) => [b.id, `${b.name}, ${b.municipality}`])),
  };
}

export function forecastWithSeed(inputs: ForecastInputs, seed: number): Promise<LiveForecast> {
  const start = new Date(Date.now() + 3_600_000);
  return forecastLiveEvent(inputs.households, inputs.targets, SimParams.parse({ seed }), {
    start,
    end: new Date(start.getTime() + LIVE_EVENT.hours * 3_600_000),
  });
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function describeForecast(inputs: ForecastInputs, f: LiveForecast): string[] {
  const hero = f.barangays.find((b) => b.barangayId === inputs.heroBarangayId)!;
  const hit = f.barangays.filter((b) => b.progress >= 1).length;
  return [
    `committed ${f.committedKw} kW, delivered ${f.deliveredKw} of ${f.targetKw} kW (${pct(f.deliveredKw / f.targetKw)})`,
    `${inputs.names.get(hero.barangayId)}: ${hero.deliveredKw} of ${hero.targetKw} kW (${pct(hero.progress)}) from simulated households alone`,
    `${hit} of ${f.barangays.length} barangays reach their target`,
  ];
}
