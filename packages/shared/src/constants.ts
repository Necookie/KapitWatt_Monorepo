/**
 * Reward constants. ALL PLACEHOLDERS for tuning; in practice the rate is set by
 * Meralco and the ERC. Change them here only, never inline elsewhere.
 */
export const REWARD = {
  /** Flat rate per verified kWh (illustrative ILP gap: PHP 20.40 generator - PHP 12.00 grid). */
  ratePhpPerKwh: 8.4,
  /** Smart-meter households earn the full rate; photo households a lower one. */
  pathMultiplier: { ami: 1.0, photo: 0.6 },
  /** Extra share of a household's own credit when its barangay hits 100% of target. */
  barangayBonusRate: 0.2,
  pointsPerKwh: 100,
  /** cap_kw = peakFactor x (bill_avg_kwh_month / hoursPerMonth) */
  peakFactor: 2,
  hoursPerMonth: 720,
} as const;

/** Fixed photo windows. Late or missing photo = no payout, no resubmission. */
export const PHOTO_RULES = {
  /** Before photo: within this many minutes after window start. */
  beforeDeadlineMin: 15,
  /** After photo: within this many minutes after window end. */
  afterDeadlineMin: 30,
} as const;

/** Settlement runs at window end plus this many minutes. */
export const SETTLEMENT_DELAY_MIN = 30;
/**
 * Automatic settlement waits this much longer than SETTLEMENT_DELAY_MIN, because the after-photo
 * deadline (window end + 30 min) is the same moment: a photo sent right at the deadline still counts.
 */
export const SETTLEMENT_GRACE_MIN = 1;

/** Reminder push to targeted households this many minutes before the window starts (P1). */
export const REMINDER_BEFORE_WINDOW_MIN = 15;

/**
 * Trust score (P1). ALL PLACEHOLDERS. Starts neutral; settlement moves it; it narrows the commit cap
 * only below neutral: cap multiplier = min(1, capFloor + score / 100), so 50 keeps the full cap and
 * 0 halves it.
 */
export const TRUST = {
  start: 50,
  min: 0,
  max: 100,
  /** A settled event with a verified cut and clean readings. */
  cleanEvent: 5,
  /** A flagged or rejected reading. */
  flaggedReading: -10,
  /** A missing or late photo. */
  missedEvent: -5,
  capFloor: 0.5,
} as const;

export const COMMIT_PRESETS_KW = [0.5, 1, 1.5, 2] as const;
/** The stepper moves in 0.1 kW, the precision kW is kept to. */
export const COMMIT_STEP_KW = 0.1;
/** Largest single commitment, whatever the baseline says. Placeholder. */
export const MAX_COMMIT_KW = 5;
export const DEFAULT_WINDOW_HOURS = 2;
/** Longest alert window the operator can send. Placeholder (NGCP alerts run about 2 hours). */
export const MAX_WINDOW_HOURS = 6;

/** GPS check: a photo must be taken within this many metres of the registered address. Placeholder. */
export const GPS_MAX_DISTANCE_M = 200;
/** Rehearsal: the two practice photos must be at least this far apart to measure a baseline. Placeholder. */
export const REHEARSAL_MIN_MINUTES = 30;
/** Largest meter photo the API accepts. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Meralco AMI meters record in 5-minute intervals. */
export const AMI_INTERVAL_MIN = 5;
/** AMI settlement needs at least this share of the window's intervals; less counts as missing data. */
export const AMI_MIN_COVERAGE = 0.8;

/** Dashboard live totals use short polling. */
export const POLL_INTERVAL_MS = 2000;

/** Meralco franchise towns in the Laguna pilot. Santa Cruz is the hub (team phones live here). */
export const PILOT_TOWNS = [
  'Santa Cruz',
  'Pila',
  'Victoria',
  'Nagcarlan',
  'Liliw',
  'Majayjay',
  'Magdalena',
] as const;
export type PilotTown = (typeof PILOT_TOWNS)[number];
export const HUB_TOWN: PilotTown = 'Santa Cruz';

/**
 * The 21 sampled pilot barangays, 3 per town. Names are from the PSA's PSGC list
 * (fetched November 2026). Which 3 per town is our own sample, not a Meralco
 * selection: swap freely, then run `pnpm db:seed`.
 */
export const PILOT_BARANGAYS: Record<PilotTown, readonly [string, string, string]> = {
  'Santa Cruz': ['Bagumbayan', 'Calios', 'Patimbao'],
  Pila: ['Bagong Pook', 'Pansol', 'Santa Clara Norte'],
  Victoria: ['Masapang', 'Nanhaya', 'San Roque'],
  Nagcarlan: ['Banago', 'Calumpang', 'Poblacion I'],
  Liliw: ['Bayate', 'Laguan', 'Rizal'],
  Majayjay: ['Botocan', 'Olla', 'Origuel'],
  Magdalena: ['Buenavista', 'Poblacion', 'Sabang'],
};
