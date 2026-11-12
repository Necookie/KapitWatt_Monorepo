/**
 * Finds a simulator seed for the live event where the presenter's barangay reaches its target from
 * simulated households alone, with the pilot as a whole near the plan's 88%. Read-only: it forecasts
 * each seed in memory (scripts/demo/live.ts) from what the database holds now, so run it after
 * `pnpm demo:reset`, then put the seed in LIVE_EVENT.seed.
 *
 *   pnpm demo:seed-search [-- --from 1 --to 3000]
 *
 * Environment (from Doppler): DATABASE_URL.
 */
import { createDb } from '@kapitwatt/db';
import { describeForecast, forecastWithSeed, LIVE_EVENT, loadForecastInputs } from './demo/live';

const arg = (name: string, fallback: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : fallback;
};
const from = arg('from', 1);
const to = arg('to', 3000);

/** Hero at 110% or more (testers only add to it); pilot between 84% and 92%; a few barangays short. */
const HERO_MIN = 1.1;
const PILOT_MIN = 0.84;
const PILOT_MAX = 0.92;
const MIN_SHORT = 4;

const db = createDb(process.env.DATABASE_URL ?? '');
const inputs = await loadForecastInputs(db);
console.log(
  `${inputs.households.length} simulated households; live alert ${LIVE_EVENT.targetKw} kW over ${LIVE_EVENT.hours} h, all pilot areas`,
);

const found: { seed: number; score: number; lines: string[] }[] = [];
for (let seed = from; seed <= to; seed++) {
  const f = await forecastWithSeed(inputs, seed);
  const hero = f.barangays.find((b) => b.barangayId === inputs.heroBarangayId)!;
  const pilot = f.deliveredKw / f.targetKw;
  const short = f.barangays.filter((b) => b.progress < 1).length;
  if (hero.progress < HERO_MIN || pilot < PILOT_MIN || pilot > PILOT_MAX || short < MIN_SHORT)
    continue;
  // Prefer a pilot total close to the plan's 88% and a comfortable hero margin.
  found.push({
    seed,
    score: Math.abs(pilot - 0.88) * 4 - Math.min(hero.progress, 1.3),
    lines: describeForecast(inputs, f),
  });
}
found.sort((a, b) => a.score - b.score);
if (found.length === 0) {
  console.log(`no seed in ${from}..${to} meets the rules; widen the range`);
  process.exit(1);
}
for (const s of found.slice(0, 5)) {
  console.log(`\nseed ${s.seed}`);
  for (const line of s.lines) console.log(`  ${line}`);
}
console.log(`\n${found.length} seeds qualify. Current LIVE_EVENT.seed: ${LIVE_EVENT.seed}`);
