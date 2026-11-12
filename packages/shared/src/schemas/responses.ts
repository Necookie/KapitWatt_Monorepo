import { z } from 'zod';
import {
  AlertLevel,
  AlertStatus,
  CheckStatus,
  CommitmentStatus,
  MeterType,
  ReadingFlag,
  ReadingKind,
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
});
export type HouseholdMe = z.infer<typeof HouseholdMe>;

/** Returned once by POST /auth/register. Store the token in secure storage; it is never shown again. */
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
  message: z.string(),
  /** Derived from server time: active (commits open), window_open, settling, settled, cancelled. */
  status: AlertStatus,
  createdBy: z.string(),
  createdAt: z.iso.datetime(),
  pushSentAt: z.iso.datetime().nullable(),
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
  resultReason: z.string().nullable(),
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
  resultReason: z.string().nullable(),
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

export const SimStatus = z.object({
  enabled: z.boolean(),
  simulatedHouseholds: z.number().int(),
  amiHouseholds: z.number().int(),
  photoHouseholds: z.number().int(),
  defaults: SimParams,
});
export type SimStatus = z.infer<typeof SimStatus>;
