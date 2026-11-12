import { z } from 'zod';

const fraction = z.number().min(0).max(1);

/** Simulation parameters. Every one of these is an assumption; keep them visible in the dashboard. */
export const SimParams = z.object({
  /** Share of households that commit. Adjustable 20% to 80%. */
  participation: fraction.default(0.6),
  /** Share of committed kW actually delivered. */
  followThrough: fraction.default(0.8),
  /** Share of households on the smart-meter path; the rest are on the photo path. */
  amiShare: fraction.default(0.15),
  /** Share of photo households that submit both photos on time and pass the checks. */
  photoCompletion: fraction.default(0.9),
  /** Plus or minus this fraction around each household's hourly baseline. */
  baselineNoise: fraction.default(0.1),
  /** kW committed per participating household. */
  cutKw: z.number().positive().default(1),
  /** Commits are spread over this many seconds so the live total rises gradually. */
  paceSeconds: z.number().min(0).max(120).default(25),
  /**
   * Participation varies by barangay by plus or minus this fraction (household-weighted mean
   * stays at `participation`), so some barangays reach their target and others fall short.
   */
  barangaySpread: fraction.default(0.25),
  /** Seeded randomness for repeatable demo runs. */
  seed: z.number().int().default(2026),
});
export type SimParams = z.infer<typeof SimParams>;

export const SimRunInput = z.object({
  alertId: z.uuid(),
  params: SimParams.prefault({}),
  /**
   * `commit`: paced commits while the alert is open. `deliver`: meter readings, sent after
   * the window has ended. Two calls so no state has to be kept between them.
   */
  phase: z.enum(['commit', 'deliver']).default('commit'),
});
export type SimRunInput = z.infer<typeof SimRunInput>;

/** What one phase of a run did. */
export const SimRunSummary = z.object({
  phase: z.enum(['commit', 'deliver']),
  /** Simulated households in the alert's target barangays. */
  households: z.number().int(),
  /** Households that hold a commitment after this phase. */
  committed: z.number().int(),
  committedKw: z.number(),
  /** Households that got readings in this phase (0 for the commit phase). */
  householdsWithReadings: z.number().int(),
});
export type SimRunSummary = z.infer<typeof SimRunSummary>;

/** GET /sim/status. */
export const SimStatus = z.object({
  households: z.number().int(),
  amiHouseholds: z.number().int(),
  photoHouseholds: z.number().int(),
  barangays: z.number().int(),
  lastRun: SimRunSummary.nullable(),
});
export type SimStatus = z.infer<typeof SimStatus>;
