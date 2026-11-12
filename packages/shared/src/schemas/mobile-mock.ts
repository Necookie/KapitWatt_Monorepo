import { z } from 'zod';
import { Alert, Commitment, MeterReading } from './entities';

/**
 * TEMPORARY. Response shapes the household app was built against on mock data, before the API
 * existed. The API's real shapes are in ./responses.ts and are the contract. Three names clashed
 * with them and carry a `Mock` prefix here (MockAlertView, MockHistoryItem, MockResultCard).
 * Sign-up and profile already use the real shapes (RegisterResult, HouseholdMe).
 * The mobile app should move to the shapes in ./responses.ts; delete this file once it has.
 */

/** Every household-facing response carries the server's clock so the app can correct countdowns. */
const ServerTime = z.iso.datetime();

/**
 * GET /alerts/active (null body when there is none) and GET /alerts/:id.
 * Photo deadlines are computed by the server, so "Measure (fast-forward)" can compress them.
 */
export const MockAlertView = z.object({
  alert: Alert,
  beforePhotoDueAt: z.iso.datetime(),
  afterPhotoOpensAt: z.iso.datetime(),
  afterPhotoDueAt: z.iso.datetime(),
  settlesAt: z.iso.datetime(),
  serverTime: ServerTime,
});
export type MockAlertView = z.infer<typeof MockAlertView>;

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
export const MockResultCard = z.object({
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
export type MockResultCard = z.infer<typeof MockResultCard>;

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
export const MockHistoryItem = z.object({
  alert: Alert.pick({ id: true, level: true, windowStart: true, windowEnd: true }),
  committedKw: z.number().positive(),
  /** null while the event has not settled yet. */
  result: MockResultCard.nullable(),
});
export type MockHistoryItem = z.infer<typeof MockHistoryItem>;
