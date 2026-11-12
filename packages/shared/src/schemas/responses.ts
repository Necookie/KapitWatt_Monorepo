import { z } from 'zod';
import { Alert, Commitment, MeterReading } from './entities';
import { MeterType } from './enums';

/**
 * Response bodies the household app reads. PROPOSAL from the mobile side (Person 1): the API owner
 * (Person 3) should confirm or adjust these before implementing the routes. Times are ISO strings
 * from the server; the app never derives a deadline from the phone clock.
 */

/** Every household-facing response carries the server's clock so the app can correct countdowns. */
const ServerTime = z.iso.datetime();

/** GET /auth/me */
export const MeResponse = z.object({
  householdId: z.uuid(),
  barangayId: z.uuid(),
  barangayName: z.string(),
  municipality: z.string(),
  meterType: MeterType,
  /** null until the rehearsal (photo path) or AMI history sets it. */
  baselineKw: z.number().nonnegative().nullable(),
  trustScore: z.number(),
  /** Largest cut the household may commit, derived by the API from baseline and trust score. */
  commitCapKw: z.number().nonnegative(),
  totalPoints: z.number().int().nonnegative(),
  serverTime: ServerTime,
});
export type MeResponse = z.infer<typeof MeResponse>;

/**
 * GET /alerts/active (null body when there is none) and GET /alerts/:id.
 * Photo deadlines are computed by the server, so "Measure (fast-forward)" can compress them.
 */
export const AlertView = z.object({
  alert: Alert,
  beforePhotoDueAt: z.iso.datetime(),
  afterPhotoOpensAt: z.iso.datetime(),
  afterPhotoDueAt: z.iso.datetime(),
  settlesAt: z.iso.datetime(),
  serverTime: ServerTime,
});
export type AlertView = z.infer<typeof AlertView>;

/** GET /commitments/by-alert/:alertId: everything the event screen needs about this household. */
export const MyEventStatus = z.object({
  commitment: Commitment.nullable(),
  /** This household's readings for the alert. A kind that is present cannot be captured again. */
  readings: z.array(MeterReading),
  /** Smart-meter households only, while the window is open: baseline minus current AMI load. */
  liveReductionKw: z.number().nullable(),
  serverTime: ServerTime,
});
export type MyEventStatus = z.infer<typeof MyEventStatus>;

/** Why a settled commitment paid nothing. Shown on the result card (NFR-U4). */
export const ZeroPayoutReason = z.enum([
  'late_photo',
  'missing_photo',
  'failed_check',
  'no_measured_cut',
  'missing_ami_data',
]);
export type ZeroPayoutReason = z.infer<typeof ZeroPayoutReason>;

/** GET /rewards/by-alert/:alertId. 404 until settlement has run. */
export const ResultCard = z.object({
  alertId: z.uuid(),
  committedKw: z.number().nonnegative(),
  cutKw: z.number().nonnegative(),
  paidCutKw: z.number().nonnegative(),
  verifiedKwh: z.number().nonnegative(),
  creditPhp: z.number().nonnegative(),
  bonusPhp: z.number().nonnegative(),
  points: z.number().int().nonnegative(),
  barangayTargetHit: z.boolean(),
  zeroReason: ZeroPayoutReason.nullable(),
});
export type ResultCard = z.infer<typeof ResultCard>;

/** POST /auth/register. The app sends the token as `Authorization: Bearer <token>` afterwards. */
export const RegisterHouseholdResponse = z.object({
  token: z.string(),
  householdId: z.uuid(),
  /** Photo households must finish the rehearsal before their first commit. */
  needsRehearsal: z.boolean(),
});
export type RegisterHouseholdResponse = z.infer<typeof RegisterHouseholdResponse>;

/** POST /readings returns the stored MeterReading (with checkStatus and flags). */
export const SubmitReadingResponse = MeterReading;
export type SubmitReadingResponse = z.infer<typeof SubmitReadingResponse>;

/** GET /barangays/leaderboard. Per barangay only, never per household (NFR-S4). */
export const LeaderboardEntry = z.object({
  rank: z.number().int().positive(),
  barangayId: z.uuid(),
  name: z.string(),
  municipality: z.string(),
  points: z.number().int().nonnegative(),
  verifiedKwh: z.number().nonnegative(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntry>;

/** GET /commitments/history: this household's past events, newest first. */
export const HistoryItem = z.object({
  alert: Alert.pick({ id: true, level: true, windowStart: true, windowEnd: true }),
  committedKw: z.number().positive(),
  /** null while the event has not settled yet. */
  result: ResultCard.nullable(),
});
export type HistoryItem = z.infer<typeof HistoryItem>;
