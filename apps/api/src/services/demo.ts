import {
  backdateAlert,
  insertSimAmiIntervals,
  insertSimPhotoReadings,
  listDemoAmiCommitments,
  listDemoHouseholds,
  quietAlert,
  type Db,
  type DemoHouseholdRow,
} from '@kapitwatt/db';
import {
  SimParams,
  type AlertLevel,
  type Barangay,
  type PilotTown,
  type SettlementResult,
} from '@kapitwatt/shared';
import { createRng, runCommits, runDelivery, type SimReading } from '@kapitwatt/sim';
import { createAlert, fastForward } from './alerts';
import { commitCapKw } from './cap';
import { commitMany } from './commit';
import { settleAlert } from './settlement';
import {
  createSimPort,
  registerPairToIntervals,
  simPhotoReadings,
  type SimWindow,
} from './sim-port';

/**
 * Demo only: the scripted history behind `pnpm demo:reset` (apps/api/scripts/demo-reset.ts), and the
 * smart-meter feed for demo accounts in a live event. Every past event runs through the real services
 * (alert, commit rules, reading checks, settlement), then its dates are moved back. Nothing here is
 * reachable from a route, and a replayed event never pushes to a phone.
 */

const MIN_MS = 60_000;
const HOUR_MS = 3_600_000;
/** Manila is UTC+8 all year (no daylight saving). */
const MANILA_OFFSET_H = 8;
/** A replayed alert is shown as sent this long before its window. */
const ALERT_LEAD_MIN = 75;

/** What a demo account does in a past event. */
export type DemoOutcome =
  | 'paid' //    commits, both photos on time (or smart-meter data), cuts about what it promised
  | 'skip' //    does not commit
  | 'late' //    commits, after photo 41 minutes after the window: no payout
  | 'missed' //  commits, takes the before photo only: no payout
  | 'flagged'; // commits, types an after reading lower than the before one: held for review

const OUTCOME_CODES: Record<string, DemoOutcome> = {
  P: 'paid',
  S: 'skip',
  L: 'late',
  M: 'missed',
  F: 'flagged',
};

export interface PastEvent {
  daysAgo: number;
  /** Window start, Manila time, on the hour. */
  startHour: number;
  hours: number;
  level: AlertLevel;
  targetKw: number;
  towns: readonly PilotTown[] | 'all';
  /** The simulated households' participation in this event (the rest of the plan defaults apply). */
  participation: number;
  seed: number;
  /**
   * One letter per demo account 01 to 09 (P paid, S skip, L late, M missed, F flagged). Account 10
   * has no baseline (it demos the practice run), so it never commits.
   */
  demo: string;
}

/**
 * Six events over four weeks, oldest first, participation rising over time. Every one targets Santa
 * Cruz, where the demo accounts live. The misses are on purpose, so the History tab shows each kind of
 * result; the flagged one is the most recent, so the dashboard's review queue has a reading in it.
 */
export const PAST_EVENTS: readonly PastEvent[] = [
  {
    daysAgo: 27,
    startHour: 14,
    hours: 2,
    level: 'yellow',
    targetKw: 180,
    towns: ['Santa Cruz', 'Pila'],
    participation: 0.5,
    seed: 101,
    demo: 'PPPPSPPPP',
  },
  {
    daysAgo: 22,
    startHour: 18,
    hours: 2,
    level: 'red',
    targetKw: 600,
    towns: 'all',
    participation: 0.55,
    seed: 102,
    demo: 'PPLPPPPPS',
  },
  {
    daysAgo: 16,
    startHour: 14,
    hours: 2,
    level: 'yellow',
    targetKw: 300,
    towns: ['Santa Cruz', 'Victoria', 'Nagcarlan'],
    participation: 0.55,
    seed: 103,
    demo: 'PSPPPMPPP',
  },
  {
    daysAgo: 11,
    startHour: 13,
    hours: 2,
    level: 'yellow',
    targetKw: 500,
    towns: 'all',
    participation: 0.6,
    seed: 104,
    demo: 'PPPPPPPSP',
  },
  {
    daysAgo: 6,
    startHour: 18,
    hours: 2,
    level: 'red',
    targetKw: 650,
    towns: 'all',
    participation: 0.65,
    seed: 105,
    demo: 'PPPLPPSPP',
  },
  {
    daysAgo: 2,
    startHour: 14,
    hours: 2,
    level: 'yellow',
    targetKw: 260,
    towns: ['Santa Cruz', 'Liliw', 'Majayjay', 'Magdalena'],
    participation: 0.6,
    seed: 106,
    demo: 'PPFPPPPPP',
  },
];

/** What each demo account (01 to 09) tries to commit, before its cap is applied. */
export const DEMO_COMMIT_KW: readonly number[] = [1.5, 1, 1, 2, 0.5, 1.5, 1, 1.5, 2];

/** Each account's meter register before the first event (photo accounts), kWh. */
export const demoStartKwh = (index: number): number => 3000 + 250 * index;

export function outcomeFor(event: PastEvent, index: number): DemoOutcome {
  const code = event.demo[index];
  if (code === undefined) return 'skip';
  const outcome = OUTCOME_CODES[code];
  if (!outcome) throw new Error(`unknown demo outcome "${code}"`);
  return outcome;
}

/** Window start of a past event: `daysAgo` Manila calendar days before `now`, at `startHour` Manila. */
export function pastWindowStart(now: Date, daysAgo: number, startHour: number): Date {
  const manila = new Date(now.getTime() + MANILA_OFFSET_H * HOUR_MS);
  return new Date(
    Date.UTC(
      manila.getUTCFullYear(),
      manila.getUTCMonth(),
      manila.getUTCDate() - daysAgo,
      startHour - MANILA_OFFSET_H,
    ),
  );
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** A household's use between two events, from its bill: kWh a day times the days. */
export const usageBetween = (billAvgKwhMonth: number, days: number): number =>
  round1((billAvgKwhMonth / 30) * Math.max(0, days));

/**
 * The kW a demo account actually draws in the window: its baseline less most of what it committed.
 * `delivery` is the share of the commitment it really cut (0.8 to 1.1 in the replay).
 */
export const demoActualKw = (baselineKw: number, committedKw: number, delivery: number): number =>
  Math.max(0.1, baselineKw - committedKw * delivery);

/** The photo readings a demo account sends for an outcome (minutes from window start). */
export function demoPhotoReadings(
  outcome: Exclude<DemoOutcome, 'skip'>,
  o: { startKwh: number; actualKw: number; windowMinutes: number },
): SimReading[] {
  const beforeMinute = 4;
  const before: SimReading = { kind: 'before', readingKwh: round1(o.startKwh), atMinute: 4 };
  if (outcome === 'missed') return [before];
  const afterMinute = o.windowMinutes + (outcome === 'late' ? 41 : 9);
  const used = (o.actualKw * (afterMinute - beforeMinute)) / 60;
  // A typo: the after reading typed lower than the before one, so the check flags it.
  const afterKwh = outcome === 'flagged' ? before.readingKwh - 9 : before.readingKwh + used;
  return [before, { kind: 'after', readingKwh: round1(afterKwh), atMinute: afterMinute }];
}

export interface ReplaySummary {
  alertId: string;
  windowStart: Date;
  settlement: SettlementResult | null;
  simulatedCommitted: number;
  demoCommitted: number;
}

const MESSAGES: Record<AlertLevel, string> = {
  yellow:
    'Yellow alert: the grid is tight this afternoon. Cut what you can during the window and earn a bill credit.',
  red: 'Red alert: the grid is short of power tonight. Every kilowatt you cut helps avoid rotating brownouts.',
};

/**
 * Replays one past event through the real services, then moves it back to its date. `previousDaysAgo`
 * is the previous event's `daysAgo` (null for the first), for the demo accounts' meter registers.
 */
export async function replayPastEvent(
  db: Db,
  event: PastEvent,
  ctx: { now: Date; barangays: readonly Barangay[]; previousDaysAgo: number | null },
): Promise<ReplaySummary> {
  const targetBarangayIds =
    event.towns === 'all'
      ? []
      : ctx.barangays
          .filter((b) => (event.towns as readonly string[]).includes(b.municipality))
          .map((b) => b.id);
  // Far enough ahead that no reminder is due before the alert is quieted (it is, at once, anyway).
  const start = new Date(Math.ceil((ctx.now.getTime() + 60 * MIN_MS) / MIN_MS) * MIN_MS);
  const end = new Date(start.getTime() + event.hours * HOUR_MS);
  const { alert } = await createAlert(
    db,
    {
      level: event.level,
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      targetKw: event.targetKw,
      targetBarangayIds,
      message: MESSAGES[event.level],
    },
    { createdBy: 'operator', idempotencyKey: null, isDemo: true },
  );
  await quietAlert(db, alert.id);

  const window: SimWindow = { start: alert.windowStart, end: alert.windowEnd };
  const windowMinutes = (window.end.getTime() - window.start.getTime()) / MIN_MS;
  const params = SimParams.parse({
    participation: event.participation,
    seed: event.seed,
    paceSeconds: 0,
  });
  const port = createSimPort(db, window, true);
  const commits = await runCommits(alert.id, params, port);

  // The demo accounts commit through the same guarded insert (cap, opt-in, baseline, cutoff).
  const demo = await listDemoHouseholds(db);
  const rng = createRng(event.seed ^ 0x2f6b1d3a);
  const plans = demo.slice(0, DEMO_COMMIT_KW.length).map((h, i) => {
    const outcome = outcomeFor(event, i);
    const cap = commitCapKw(h.baselineKw, h.billAvgKwhMonth, h.trustScore) ?? 0;
    const committedKw = Math.min(DEMO_COMMIT_KW[i]!, cap);
    return { h, i, outcome, committedKw, delivery: 0.8 + rng() * 0.3 };
  });
  const wanted = plans.filter((p) => p.outcome !== 'skip' && p.committedKw > 0);
  const committed = new Set(
    await commitMany(
      db,
      alert.id,
      wanted.map((p) => ({ householdId: p.h.id, committedKw: p.committedKw })),
      true,
      true,
    ),
  );

  await fastForward(db, alert.id, 'window_end', true);
  await runDelivery(alert.id, params, port, windowMinutes);
  await sendDemoReadings(
    db,
    alert.id,
    window,
    wanted.filter((p) => committed.has(p.h.id)),
    event,
    ctx,
  );

  const settlement = await settleAlert(db, alert.id, { isDemo: true, force: true });
  const target = pastWindowStart(ctx.now, event.daysAgo, event.startHour);
  await backdateAlert(
    db,
    alert.id,
    Math.round((target.getTime() - window.start.getTime()) / 1000),
    ALERT_LEAD_MIN,
  );
  return {
    alertId: alert.id,
    windowStart: target,
    settlement,
    simulatedCommitted: commits.committed,
    demoCommitted: committed.size,
  };
}

async function sendDemoReadings(
  db: Db,
  alertId: string,
  window: SimWindow,
  plans: {
    h: DemoHouseholdRow;
    i: number;
    outcome: DemoOutcome;
    committedKw: number;
    delivery: number;
  }[],
  event: PastEvent,
  ctx: { previousDaysAgo: number | null },
): Promise<void> {
  const windowMinutes = (window.end.getTime() - window.start.getTime()) / MIN_MS;
  const photo: Parameters<typeof insertSimPhotoReadings>[2] = [];
  const intervals: ReturnType<typeof registerPairToIntervals> = [];
  for (const { h, i, outcome, committedKw, delivery } of plans) {
    if (outcome === 'skip' || h.baselineKw === null) continue;
    const actualKw = demoActualKw(h.baselineKw, committedKw, delivery);
    if (h.meterType === 'ami') {
      // The fake smart-meter feed: only 'paid' or 'skip' make sense for a meter nobody photographs.
      intervals.push(...registerPairToIntervals(h.id, window, 0, (actualKw * windowMinutes) / 60));
      continue;
    }
    const gapDays = ctx.previousDaysAgo === null ? 0 : ctx.previousDaysAgo - event.daysAgo;
    const startKwh =
      (h.lastReadingKwh ?? demoStartKwh(i)) + usageBetween(h.billAvgKwhMonth, gapDays);
    const last =
      h.lastReadingKwh !== null && h.lastReadingAt
        ? { kwh: h.lastReadingKwh, at: h.lastReadingAt }
        : null;
    photo.push(
      ...simPhotoReadings(
        h,
        window,
        demoPhotoReadings(outcome, { startKwh, actualKw, windowMinutes }),
        last,
      ),
    );
  }
  await insertSimPhotoReadings(db, alertId, photo);
  await insertSimAmiIntervals(db, alertId, intervals);
}

/**
 * Live event, deliver phase: the fake smart-meter feed for demo accounts a tester committed on the
 * phone. The feed stands in for the meter, not for the person: the commitment was the tester's.
 * Same delivery rule as the simulator's households (follow-through of the commitment, no noise).
 */
export async function deliverDemoSmartMeters(
  db: Db,
  alertId: string,
  window: SimWindow,
  followThrough: number,
): Promise<number> {
  const rows = await listDemoAmiCommitments(db, alertId);
  const hours = (window.end.getTime() - window.start.getTime()) / HOUR_MS;
  const intervals = rows.flatMap((r) =>
    registerPairToIntervals(
      r.householdId,
      window,
      0,
      demoActualKw(r.baselineKw, r.committedKw, followThrough) * hours,
    ),
  );
  await insertSimAmiIntervals(db, alertId, intervals);
  return rows.length;
}
