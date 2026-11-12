import { z } from 'zod';
import { COMMIT_STEP_KW, MAX_COMMIT_KW } from '../constants';
import { AlertLevel, MeterType, ReadingKind } from './enums';

/** Request and response bodies. The API validates with these; the apps type their calls with them. */

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

export const RegisterHouseholdInput = z.object({
  barangayId: z.uuid(),
  meterType: MeterType,
  meterSerial: z.string().trim().min(1).max(64),
  billAvgKwhMonth: z.number().positive().max(10_000),
  /** Registered address, used for the GPS distance check on photos. */
  lat: latitude,
  lng: longitude,
  /** Consent to alerts and data use (Data Privacy Act 2012). Must be true to register. */
  consent: z.literal(true),
  pushToken: z.string().min(1).max(255).optional(),
});
export type RegisterHouseholdInput = z.infer<typeof RegisterHouseholdInput>;

export const UpdatePushTokenInput = z.object({
  pushToken: z.string().min(1).max(255),
});
export type UpdatePushTokenInput = z.infer<typeof UpdatePushTokenInput>;

export const CreateAlertInput = z
  .object({
    level: AlertLevel,
    windowStart: z.iso.datetime(),
    windowEnd: z.iso.datetime(),
    targetKw: z.number().positive().max(1_000_000),
    /** Empty array = all pilot areas. */
    targetBarangayIds: z.array(z.uuid()).max(100),
    message: z.string().trim().min(1).max(500),
  })
  .refine((a) => Date.parse(a.windowEnd) > Date.parse(a.windowStart), {
    message: 'windowEnd must be after windowStart',
    path: ['windowEnd'],
  });
export type CreateAlertInput = z.infer<typeof CreateAlertInput>;

/** Operator override of one or more barangay shares of an alert's target. */
export const UpdateTargetsInput = z.object({
  targets: z
    .array(z.object({ barangayId: z.uuid(), targetKw: z.number().nonnegative().max(1_000_000) }))
    .min(1)
    .max(100),
});
export type UpdateTargetsInput = z.infer<typeof UpdateTargetsInput>;

export const CreateCommitmentInput = z.object({
  alertId: z.uuid(),
  committedKw: z
    .number()
    .min(COMMIT_STEP_KW)
    .max(MAX_COMMIT_KW)
    .refine((kw) => Math.abs(kw / COMMIT_STEP_KW - Math.round(kw / COMMIT_STEP_KW)) < 1e-9, {
      message: `committedKw must be a multiple of ${COMMIT_STEP_KW}`,
    }),
});
export type CreateCommitmentInput = z.infer<typeof CreateCommitmentInput>;

/** Sent as multipart form data alongside the photo file (field name `photo`). */
export const SubmitReadingInput = z.object({
  kind: ReadingKind,
  /** Omitted for the rehearsal. */
  alertId: z.uuid().optional(),
  readingKwh: z.coerce.number().nonnegative().max(10_000_000),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
export type SubmitReadingInput = z.infer<typeof SubmitReadingInput>;

export const ReviewReadingInput = z.object({
  decision: z.enum(['approve', 'reject']),
});
export type ReviewReadingInput = z.infer<typeof ReviewReadingInput>;

export const BarangayTotals = z.object({
  barangayId: z.uuid(),
  name: z.string(),
  municipality: z.string(),
  targetKw: z.number(),
  committedKw: z.number(),
  deliveredKw: z.number(),
  targetHit: z.boolean(),
});
export type BarangayTotals = z.infer<typeof BarangayTotals>;

/** What the dashboard polls every POLL_INTERVAL_MS. */
export const AlertTotals = z.object({
  alertId: z.uuid(),
  targetKw: z.number(),
  committedKw: z.number(),
  deliveredKw: z.number(),
  barangays: z.array(BarangayTotals),
});
export type AlertTotals = z.infer<typeof AlertTotals>;
