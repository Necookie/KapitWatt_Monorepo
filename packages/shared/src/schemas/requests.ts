import { z } from 'zod';
import {
  ACCOUNT_NUMBER_DIGITS,
  COMMIT_STEP_KW,
  MAX_COMMIT_KW,
  PASSWORD_MIN_LENGTH,
} from '../constants';
import { Barangay } from './entities';
import { AlertLevel, AlertStatus, MeterType, ReadingKind } from './enums';

/** Request and response bodies. The API validates with these; the apps type their calls with them. */

const latitude = z.number().min(-90).max(90);
/** Expo push tokens, as returned by getExpoPushTokenAsync. */
const expoPushToken = z
  .string()
  .max(255)
  .regex(/^Expo(nent)?PushToken\[[^\]]+\]$/, 'must be an Expo push token');
const longitude = z.number().min(-180).max(180);

/** Login email: trimmed and lower-cased, so one address is one account. */
const email = z.string().trim().toLowerCase().max(254).pipe(z.email('must be an email address'));
/** Long enough to resist guessing; the upper bound keeps hashing cheap. */
const password = z.string().min(PASSWORD_MIN_LENGTH).max(128);
/** Meralco Customer Account Number. Format only: nothing is checked against Meralco in the pilot. */
const accountNumber = z
  .string()
  .trim()
  .regex(
    new RegExp(`^[0-9]{${ACCOUNT_NUMBER_DIGITS}}$`),
    `must be ${ACCOUNT_NUMBER_DIGITS} digits`,
  );
const accountName = z.string().trim().min(2).max(120);
const serviceAddress = z.string().trim().min(5).max(200);

export const RegisterHouseholdInput = z.object({
  /** The household's login. */
  email,
  password,
  /** The Meralco account the bill credit goes to: CAN, registered holder, service address. */
  accountNumber,
  accountName,
  serviceAddress,
  barangayId: z.uuid(),
  meterType: MeterType,
  meterSerial: z.string().trim().min(1).max(64),
  /** At least 1 kWh: the column keeps 2 decimals, so a tiny value would round to 0 and fail. */
  billAvgKwhMonth: z.number().min(1).max(10_000),
  /** Registered address, used for the GPS distance check on photos. */
  lat: latitude,
  lng: longitude,
  /** Consent to the collection and use of personal data (Data Privacy Act 2012). Must be true. */
  consent: z.literal(true),
  /** Separate consent to receive grid alerts. Must be true to join; can be turned off later. */
  alertsConsent: z.literal(true),
  pushToken: expoPushToken.optional(),
});
export type RegisterHouseholdInput = z.infer<typeof RegisterHouseholdInput>;

export const LoginInput = z.object({ email, password: z.string().min(1).max(128) });
export type LoginInput = z.infer<typeof LoginInput>;

/** PATCH /auth/me: correct the account details, or turn grid alerts off and on. */
export const UpdateProfileInput = z
  .object({
    accountName: accountName.optional(),
    serviceAddress: serviceAddress.optional(),
    /** false opts the household out: no more alerts or events until it is turned back on. */
    optedIn: z.boolean().optional(),
  })
  .refine((p) => Object.values(p).some((v) => v !== undefined), { message: 'nothing to update' });
export type UpdateProfileInput = z.infer<typeof UpdateProfileInput>;

/** DELETE /auth/me: withdraw consent and erase the household. The password confirms it. */
export const DeleteAccountInput = z.object({ password: z.string().min(1).max(128) });
export type DeleteAccountInput = z.infer<typeof DeleteAccountInput>;

export const UpdatePushTokenInput = z.object({
  pushToken: expoPushToken,
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
    /** P1: send later (the push goes out at this time). Omit to send now. */
    sendAt: z.iso.datetime().optional(),
  })
  .refine((a) => Date.parse(a.windowEnd) > Date.parse(a.windowStart), {
    message: 'windowEnd must be after windowStart',
    path: ['windowEnd'],
  })
  .refine((a) => a.sendAt === undefined || Date.parse(a.sendAt) < Date.parse(a.windowStart), {
    message: 'sendAt must be before windowStart',
    path: ['sendAt'],
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
  /**
   * Summed baseline kW of the households with a commitment: what they would draw in the
   * window without the alert. Lets the dashboard draw baseline against actual (FR-DASH-14).
   */
  baselineKw: z.number().optional(),
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
