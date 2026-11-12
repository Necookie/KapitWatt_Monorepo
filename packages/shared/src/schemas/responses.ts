import { z } from 'zod';
import {
  AlertLevel,
  AlertStatus,
  CheckStatus,
  CommitmentStatus,
  MeterType,
  ReadingFlag,
  ReadingKind,
  ResultReason,
  VerificationPath,
} from './enums';
import { SimParams } from './sim';

/**
 * Response bodies. The API returns exactly these shapes; the apps type (and may parse) their calls with
 * them. Times are ISO strings from the server clock: show countdowns against `serverNow`, never the phone
 * clock.
 */

/** Every non-2xx response. `requestId` matches the X-Request-Id header, for support. */
export const ApiErrorBody = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBody>;

export const HouseholdMe = z.object({
  id: z.uuid(),
  barangayId: z.uuid(),
  barangayName: z.string(),
  municipality: z.string(),
  meterType: MeterType,
  path: VerificationPath,
  meterSerial: z.string(),
  billAvgKwhMonth: z.number(),
  /** null until the rehearsal (photo path) or AMI history sets it. */
  baselineKw: z.number().nullable(),
  /** Photo households must finish the rehearsal before they can commit. */
  needsRehearsal: z.boolean(),
  /** Readings taken so far in the rehearsal (0, 1 or 2). */
  rehearsalReadings: z.number().int(),
  trustScore: z.number(),
  /** Largest cut this household may commit; null until it has a baseline. */
  commitCapKw: z.number().nullable(),
  optedIn: z.boolean(),
  points: z.number().int(),
  creditPhp: z.number(),
  /** Login and Meralco account details. Null for households that signed up before they existed. */
  email: z.string().nullable(),
  accountName: z.string().nullable(),
  /** Only the last four digits are ever sent back, e.g. "••••••1234". */
  accountNumberMasked: z.string().nullable(),
  serviceAddress: z.string().nullable(),
  /** When the household consented under the Data Privacy Act 2012. */
  consentAt: z.iso.datetime().nullable(),
});
export type HouseholdMe = z.infer<typeof HouseholdMe>;

/** Returned by POST /auth/register and POST /auth/login. Store the token in secure storage; it is never shown again. */
export const RegisterResult = z.object({
  token: z.string(),
  household: HouseholdMe,
});
export type RegisterResult = z.infer<typeof RegisterResult>;

export const AlertView = z.object({
  id: z.uuid(),
  level: AlertLevel,
  windowStart: z.iso.datetime(),
  windowEnd: z.iso.datetime(),
  targetKw: z.number(),
  targetBarangayIds: z.array(z.uuid()),
  /** Targets marked as at risk of a brownout (simulated). Always sent by the API; optional so older
   *  fixtures still type-check. */
  atRiskBarangayIds: z.array(z.uuid()).optional(),
  message: z.string(),
  /** Derived from server time: active (commits open), window_open, settling, settled, cancelled. */
  status: AlertStatus,
  createdBy: z.string(),
  createdAt: z.iso.datetime(),
  pushSentAt: z.iso.datetime().nullable(),
  /** P1: when a scheduled alert goes out; null when it was sent on creation. Always sent by the API;
   *  optional so fixtures that predate it still type-check. */
  sendAt: z.iso.datetime().nullable().optional(),
  /** Server time for this alert (includes the demo fast-forward offset). */
  serverNow: z.iso.datetime(),
});
export type AlertView = z.infer<typeof AlertView>;

/** GET /alerts/active: the alert a household should be looking at, or null. */
export const ActiveAlertResponse = z.object({ alert: AlertView.nullable() });
export type ActiveAlertResponse = z.infer<typeof ActiveAlertResponse>;

/** GET /alerts (operator): the alert log, newest first. */
export const AlertLogResponse = z.object({ alerts: z.array(AlertView) });
export type AlertLogResponse = z.infer<typeof AlertLogResponse>;

export const AlertTarget = z.object({
  barangayId: z.uuid(),
  name: z.string(),
  municipality: z.string(),
  targetKw: z.number(),
  isOverride: z.boolean(),
});
export type AlertTarget = z.infer<typeof AlertTarget>;

/** PUT /alerts/:id/targets (operator): every target of the alert after the override. */
export const AlertTargetsResponse = z.object({ targets: z.array(AlertTarget) });
export type AlertTargetsResponse = z.infer<typeof AlertTargetsResponse>;

export const ReadingSummary = z.object({
  id: z.uuid(),
  kind: ReadingKind,
  readingKwh: z.number(),
  capturedAt: z.iso.datetime(),
  checkStatus: CheckStatus,
  flags: z.array(ReadingFlag),
});
export type ReadingSummary = z.infer<typeof ReadingSummary>;

export const PhotoDeadlines = z.object({
  beforeOpensAt: z.iso.datetime(),
  beforeClosesAt: z.iso.datetime(),
  afterOpensAt: z.iso.datetime(),
  afterClosesAt: z.iso.datetime(),
});
export type PhotoDeadlines = z.infer<typeof PhotoDeadlines>;

export const BarangayProgress = z.object({
  barangayId: z.uuid(),
  name: z.string(),
  targetKw: z.number(),
  deliveredKw: z.number(),
  /** deliveredKw / targetKw, can exceed 1. */
  progress: z.number(),
  targetHit: z.boolean(),
});
export type BarangayProgress = z.infer<typeof BarangayProgress>;

export const CommitmentView = z.object({
  id: z.uuid(),
  alertId: z.uuid(),
  committedKw: z.number(),
  path: VerificationPath,
  baselineKw: z.number(),
  status: CommitmentStatus,
  actualKw: z.number().nullable(),
  verifiedKwh: z.number().nullable(),
  /** Why a commitment earned nothing (late photo, missing data, ...). */
  resultReason: ResultReason.nullable(),
  /** Photo path only. */
  deadlines: PhotoDeadlines.nullable(),
  readings: z.object({ before: ReadingSummary.nullable(), after: ReadingSummary.nullable() }),
  barangay: BarangayProgress,
  /** Smart-meter path only, during the window: baseline minus measured kW so far. */
  liveReductionKw: z.number().nullable(),
  serverNow: z.iso.datetime(),
});
export type CommitmentView = z.infer<typeof CommitmentView>;

export const SubmitReadingResult = z.object({
  id: z.uuid(),
  kind: ReadingKind,
  checkStatus: CheckStatus,
  flags: z.array(ReadingFlag),
  /** Set when this reading completed the rehearsal. */
  baselineKw: z.number().nullable(),
});
export type SubmitReadingResult = z.infer<typeof SubmitReadingResult>;

export const ResultCard = z.object({
  alertId: z.uuid(),
  path: VerificationPath,
  status: CommitmentStatus,
  committedKw: z.number(),
  verifiedKwh: z.number(),
  creditPhp: z.number(),
  bonusPhp: z.number(),
  points: z.number().int(),
  barangay: BarangayProgress,
  /** Why it earned nothing; null when it was paid. */
  resultReason: ResultReason.nullable(),
  /** Measured cut and the part that was paid (capped by commitment and bill). */
  cutKw: z.number().nullable(),
  paidCutKw: z.number().nullable(),
});
export type ResultCard = z.infer<typeof ResultCard>;

export const RewardsSummary = z.object({
  points: z.number().int(),
  creditPhp: z.number(),
  bonusPhp: z.number(),
  events: z.number().int(),
});
export type RewardsSummary = z.infer<typeof RewardsSummary>;

export const HistoryItem = z.object({
  alertId: z.uuid(),
  level: AlertLevel,
  windowStart: z.iso.datetime(),
  windowEnd: z.iso.datetime(),
  committedKw: z.number(),
  status: CommitmentStatus,
  verifiedKwh: z.number().nullable(),
  creditPhp: z.number(),
  bonusPhp: z.number(),
  points: z.number().int(),
});
export type HistoryItem = z.infer<typeof HistoryItem>;

/** GET /commitments/history: this household's events, newest first. */
export const HistoryResponse = z.object({ history: z.array(HistoryItem) });
export type HistoryResponse = z.infer<typeof HistoryResponse>;

/** Barangay ranking: aggregates only, never household rows. */
export const LeaderboardRow = z.object({
  barangayId: z.uuid(),
  name: z.string(),
  municipality: z.string(),
  verifiedKwh: z.number(),
  points: z.number().int(),
  households: z.number().int(),
});
export type LeaderboardRow = z.infer<typeof LeaderboardRow>;

/** GET /barangays/leaderboard: ranked by verified kWh, highest first. */
export const LeaderboardResponse = z.object({ leaderboard: z.array(LeaderboardRow) });
export type LeaderboardResponse = z.infer<typeof LeaderboardResponse>;

/** POST /alerts/:id/settle: what settlement recorded. Repeating it returns the same result. */
export const SettlementResult = z.object({
  alertId: z.uuid(),
  settledAt: z.iso.datetime(),
  commitments: z.number().int(),
  verifiedCount: z.number().int(),
  deliveredKw: z.number(),
});
export type SettlementResult = z.infer<typeof SettlementResult>;

/** Operator-only. */
export const FlaggedReading = z.object({
  id: z.uuid(),
  alertId: z.uuid().nullable(),
  barangayName: z.string(),
  municipality: z.string(),
  meterSerial: z.string(),
  kind: ReadingKind,
  readingKwh: z.number(),
  previousKwh: z.number().nullable(),
  capturedAt: z.iso.datetime(),
  flags: z.array(ReadingFlag),
  hasPhoto: z.boolean(),
});
export type FlaggedReading = z.infer<typeof FlaggedReading>;

/** GET /readings/flagged (operator): readings waiting for a person, newest first. */
export const FlaggedReadingsResponse = z.object({ readings: z.array(FlaggedReading) });
export type FlaggedReadingsResponse = z.infer<typeof FlaggedReadingsResponse>;

/**
 * POST /readings/:id/review (operator). When the alert had already settled, the commitment is
 * settled again and its new result is included.
 */
export const ReviewResult = z.object({
  readingId: z.uuid(),
  checkStatus: CheckStatus,
  commitment: z
    .object({
      status: CommitmentStatus,
      resultReason: ResultReason.nullable(),
      creditPhp: z.number(),
      bonusPhp: z.number(),
      points: z.number().int(),
    })
    .nullable(),
});
export type ReviewResult = z.infer<typeof ReviewResult>;

export const SimStatus = z.object({
  enabled: z.boolean(),
  simulatedHouseholds: z.number().int(),
  amiHouseholds: z.number().int(),
  photoHouseholds: z.number().int(),
  defaults: SimParams,
});
export type SimStatus = z.infer<typeof SimStatus>;

// ---- Analytics (operator) ---------------------------------------------------------------------

/**
 * Verification funnel stages, per verification path:
 *   committed          households that committed
 *   evidence_started   photo: sent the before photo; smart meter: any interval data
 *   evidence_complete  photo: both photos passed (or were approved); smart meter: enough intervals
 *   verified           settled with a verified cut (0 until settlement)
 */
export const FunnelStage = z.enum([
  'committed',
  'evidence_started',
  'evidence_complete',
  'verified',
]);
export type FunnelStage = z.infer<typeof FunnelStage>;

/** What became of each commitment. `awaiting_settlement` until the alert settles. */
export const AnalyticsOutcome = z.enum([
  'verified',
  'awaiting_settlement',
  'pending_review',
  'missing_photo',
  'late_photo',
  'failed_check',
  'no_measured_cut',
  'missing_ami_data',
]);
export type AnalyticsOutcome = z.infer<typeof AnalyticsOutcome>;

/** GET /analytics/alerts/:id: one alert's analytics. Aggregates only, never household rows. */
export const AlertAnalytics = z.object({
  alertId: z.uuid(),
  status: AlertStatus,
  targetKw: z.number(),
  /** Opted-in households in the targeted barangays. */
  optedInHouseholds: z.number().int(),
  committedHouseholds: z.number().int(),
  committedKw: z.number(),
  /** Live delivered kW, or the settled figure once settled. */
  deliveredKw: z.number(),
  verifiedKwh: z.number(),
  barangays: z.number().int(),
  barangaysAtTarget: z.number().int(),
  funnel: z.array(z.object({ stage: FunnelStage, ami: z.number().int(), photo: z.number().int() })),
  outcomes: z.array(z.object({ outcome: AnalyticsOutcome, households: z.number().int() })),
  /** Smart meter vs photo, side by side: what each path committed, verified and was paid. */
  paths: z.array(
    z.object({
      path: VerificationPath,
      committedHouseholds: z.number().int(),
      committedKw: z.number(),
      verifiedHouseholds: z.number().int(),
      verifiedKwh: z.number(),
      paidPhp: z.number(),
    }),
  ),
  payouts: z.object({
    creditPhp: z.number(),
    bonusPhp: z.number(),
    points: z.number().int(),
    /** (credit + bonus) / verified kWh; null before anything is verified. */
    costPerKwhPhp: z.number().nullable(),
  }),
  /** Committed kW over time, cumulative, from the commitments' own timestamps (at most 60 points). */
  timeline: z.array(
    z.object({ at: z.iso.datetime(), committedKw: z.number(), households: z.number().int() }),
  ),
});
export type AlertAnalytics = z.infer<typeof AlertAnalytics>;

export const AlertHistoryItem = z.object({
  alertId: z.uuid(),
  level: AlertLevel,
  status: AlertStatus,
  createdAt: z.iso.datetime(),
  windowStart: z.iso.datetime(),
  targetKw: z.number(),
  committedHouseholds: z.number().int(),
  committedKw: z.number(),
  /** Settled delivered kW; null until the alert settles. */
  deliveredKw: z.number().nullable(),
  verifiedCount: z.number().int().nullable(),
  /** Verified kWh (0 until settled). With paidPhp it gives the cost per verified kWh. */
  verifiedKwh: z.number(),
  paidPhp: z.number(),
});
export type AlertHistoryItem = z.infer<typeof AlertHistoryItem>;

/** GET /analytics/history: recent alerts, newest first. */
export const AlertHistoryResponse = z.object({ alerts: z.array(AlertHistoryItem) });
export type AlertHistoryResponse = z.infer<typeof AlertHistoryResponse>;
