import { z } from 'zod';
import { Barangay } from './entities';
import { AlertLevel, AlertStatus, MeterType, ReadingKind } from './enums';

/** Request and response bodies. The API validates with these; the apps type their calls with them. */

export const RegisterHouseholdInput = z.object({
  barangayId: z.uuid(),
  meterType: MeterType,
  meterSerial: z.string().min(1),
  billAvgKwhMonth: z.number().positive(),
  /** Registered address, used for the GPS distance check on photos. */
  lat: z.number(),
  lng: z.number(),
  /** Consent to alerts and data use (Data Privacy Act 2012). Must be true to register. */
  consent: z.literal(true),
  pushToken: z.string().optional(),
});
export type RegisterHouseholdInput = z.infer<typeof RegisterHouseholdInput>;

export const CreateAlertInput = z
  .object({
    level: AlertLevel,
    windowStart: z.iso.datetime(),
    windowEnd: z.iso.datetime(),
    targetKw: z.number().positive(),
    /** Empty array = all pilot areas. */
    targetBarangayIds: z.array(z.uuid()),
    message: z.string().min(1),
  })
  .refine((a) => a.windowEnd > a.windowStart, { message: 'windowEnd must be after windowStart' });
export type CreateAlertInput = z.infer<typeof CreateAlertInput>;

export const CreateCommitmentInput = z.object({
  alertId: z.uuid(),
  committedKw: z.number().positive(),
});
export type CreateCommitmentInput = z.infer<typeof CreateCommitmentInput>;

/** Sent as multipart form data alongside the photo file. */
export const SubmitReadingInput = z.object({
  kind: ReadingKind,
  /** Omitted for the rehearsal. */
  alertId: z.uuid().optional(),
  readingKwh: z.coerce.number().nonnegative(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
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
  /** Opted-in households in the barangay (the share the target was split by). */
  households: z.number().int().optional(),
  /** Households with a commitment for this alert. */
  committedHouseholds: z.number().int().optional(),
  /** Delivered kW by verification path. The two add up to deliveredKw. */
  deliveredAmiKw: z.number().optional(),
  deliveredPhotoKw: z.number().optional(),
});
export type BarangayTotals = z.infer<typeof BarangayTotals>;

/** What the dashboard polls every POLL_INTERVAL_MS. */
export const AlertTotals = z.object({
  alertId: z.uuid(),
  targetKw: z.number(),
  committedKw: z.number(),
  deliveredKw: z.number(),
  barangays: z.array(BarangayTotals),
  /** Lets the dashboard drive its stage stepper from the one polled call. */
  status: AlertStatus.optional(),
  committedHouseholds: z.number().int().optional(),
  deliveredAmiKw: z.number().optional(),
  deliveredPhotoKw: z.number().optional(),
});
export type AlertTotals = z.infer<typeof AlertTotals>;

/** GET /barangays row: the barangay plus its opted-in household count (alert form confirm step). */
export const BarangayWithCount = Barangay.extend({
  optedInHouseholds: z.number().int().nonnegative().optional(),
});
export type BarangayWithCount = z.infer<typeof BarangayWithCount>;

/**
 * Demo stage control. `window_start` opens the window now (commits close, before photos open);
 * `window_end` ends it now and compresses the photo timers. Settlement is a separate call.
 */
export const FastForwardInput = z.object({
  to: z.enum(['window_start', 'window_end']).default('window_end'),
});
export type FastForwardInput = z.infer<typeof FastForwardInput>;
