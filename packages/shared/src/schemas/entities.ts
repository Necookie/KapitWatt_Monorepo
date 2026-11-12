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

/** Mirrors the tables in packages/db/migrations. Keep the two in sync. */

export const Barangay = z.object({
  id: z.uuid(),
  name: z.string(),
  municipality: z.string(),
  feederId: z.string().nullable(),
});
export type Barangay = z.infer<typeof Barangay>;

export const Household = z.object({
  id: z.uuid(),
  barangayId: z.uuid(),
  pushToken: z.string().nullable(),
  meterType: MeterType,
  meterSerial: z.string(),
  billAvgKwhMonth: z.number().positive(),
  baselineKw: z.number().nonnegative().nullable(),
  trustScore: z.number(),
  optedIn: z.boolean(),
  /** Data Privacy Act 2012 consent time. */
  consentAt: z.iso.datetime().nullable(),
  /** Registered address, for the GPS check on photos. */
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  isSimulated: z.boolean(),
  /** Login email and the Meralco account (0004). Absent for simulated and older households. */
  email: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  accountName: z.string().nullable().optional(),
  serviceAddress: z.string().nullable().optional(),
  /** One of the ten demo accounts (0005, `pnpm demo:reset`). Optional so older rows still parse. */
  isDemo: z.boolean().optional(),
  // auth_token_hash, token_created_at and password_hash stay server-side only and are deliberately
  // not mirrored.
});
export type Household = z.infer<typeof Household>;

export const Alert = z.object({
  id: z.uuid(),
  level: AlertLevel,
  windowStart: z.iso.datetime(),
  windowEnd: z.iso.datetime(),
  targetKw: z.number().positive(),
  targetBarangayIds: z.array(z.uuid()),
  /** Targets marked as at risk of a brownout (simulated in the pilot). */
  atRiskBarangayIds: z.array(z.uuid()).optional(),
  message: z.string(),
  status: AlertStatus,
  createdBy: z.string(),
  createdAt: z.iso.datetime(),
  /** Demo only: seconds added to server time for this alert (Measure / fast-forward). */
  clockOffsetSec: z.number().int().nonnegative(),
  settledAt: z.iso.datetime().nullable(),
  cancelledAt: z.iso.datetime().nullable(),
  pushSentAt: z.iso.datetime().nullable(),
  /** P1: scheduled send time; null (or absent) when sent on creation. */
  sendAt: z.iso.datetime().nullable().optional(),
});
export type Alert = z.infer<typeof Alert>;

/** An alert's target split across barangays, with operator overrides. */
export const AlertBarangayTarget = z.object({
  alertId: z.uuid(),
  barangayId: z.uuid(),
  targetKw: z.number().nonnegative(),
  isOverride: z.boolean(),
});
export type AlertBarangayTarget = z.infer<typeof AlertBarangayTarget>;

/** One row per settled alert; guards against settling twice. */
export const Settlement = z.object({
  alertId: z.uuid(),
  settledAt: z.iso.datetime(),
  verifiedCount: z.number().int().nonnegative(),
  deliveredKw: z.number().nonnegative(),
});
export type Settlement = z.infer<typeof Settlement>;

export const Commitment = z.object({
  id: z.uuid(),
  alertId: z.uuid(),
  householdId: z.uuid(),
  committedKw: z.number().positive(),
  path: VerificationPath,
  baselineKw: z.number().nonnegative(),
  actualKw: z.number().nonnegative().nullable(),
  verifiedKwh: z.number().nonnegative().nullable(),
  status: CommitmentStatus,
  /** Why a commitment earned nothing (late photo, missing data, ...). */
  resultReason: z.string().nullable(),
});
export type Commitment = z.infer<typeof Commitment>;

export const MeterReading = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  /** null for the rehearsal reading taken at sign-up. */
  commitmentId: z.uuid().nullable(),
  kind: ReadingKind,
  readingKwh: z.number().nonnegative(),
  /** Server time of the upload (plus the alert's demo offset), never the phone clock. */
  capturedAt: z.iso.datetime(),
  /** Real server time of the upload. */
  receivedAt: z.iso.datetime(),
  /** Private R2 object key; never a public URL. */
  photoKey: z.string().nullable(),
  /** GPS sent with the photo. */
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  checkStatus: CheckStatus,
  flags: z.array(ReadingFlag),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.iso.datetime().nullable(),
});
export type MeterReading = z.infer<typeof MeterReading>;

export const Reward = z.object({
  id: z.uuid(),
  commitmentId: z.uuid(),
  creditPhp: z.number().nonnegative(),
  bonusPhp: z.number().nonnegative(),
  points: z.number().int().nonnegative(),
});
export type Reward = z.infer<typeof Reward>;

/** Smart-meter 5-minute interval energy, from the AMI feed (simulated in the demo). */
export const AmiInterval = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  intervalStart: z.iso.datetime(),
  kwh: z.number().nonnegative(),
  isSimulated: z.boolean(),
});
export type AmiInterval = z.infer<typeof AmiInterval>;

/** Optional estimator only. Nothing is paid from appliance declarations. */
export const Appliance = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  type: z.string(),
  ratedKw: z.number().positive(),
});
export type Appliance = z.infer<typeof Appliance>;
