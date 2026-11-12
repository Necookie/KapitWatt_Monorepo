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
  isSimulated: z.boolean(),
});
export type Household = z.infer<typeof Household>;

export const Alert = z.object({
  id: z.uuid(),
  level: AlertLevel,
  windowStart: z.iso.datetime(),
  windowEnd: z.iso.datetime(),
  targetKw: z.number().positive(),
  targetBarangayIds: z.array(z.uuid()),
  message: z.string(),
  status: AlertStatus,
  createdBy: z.string(),
  createdAt: z.iso.datetime(),
});
export type Alert = z.infer<typeof Alert>;

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
});
export type Commitment = z.infer<typeof Commitment>;

export const MeterReading = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  /** null for the rehearsal reading taken at sign-up. */
  commitmentId: z.uuid().nullable(),
  kind: ReadingKind,
  readingKwh: z.number().nonnegative(),
  /** Server timestamp of the upload, never the phone clock. */
  capturedAt: z.iso.datetime(),
  photoUrl: z.string().nullable(),
  checkStatus: CheckStatus,
  flags: z.array(ReadingFlag),
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

/** Optional estimator only. Nothing is paid from appliance declarations. */
export const Appliance = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  type: z.string(),
  ratedKw: z.number().positive(),
});
export type Appliance = z.infer<typeof Appliance>;
