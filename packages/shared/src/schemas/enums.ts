import { z } from 'zod';

export const AlertLevel = z.enum(['yellow', 'red']);
export type AlertLevel = z.infer<typeof AlertLevel>;

export const AlertStatus = z.enum([
  'scheduled',
  'active',
  'window_open',
  'settling',
  'settled',
  'cancelled',
]);
export type AlertStatus = z.infer<typeof AlertStatus>;

/** What kind of billing meter the household has. */
export const MeterType = z.enum(['ami', 'standard']);
export type MeterType = z.infer<typeof MeterType>;

/** How a cut is verified: Meralco AMI interval data, or in-app meter photos. */
export const VerificationPath = z.enum(['ami', 'photo']);
export type VerificationPath = z.infer<typeof VerificationPath>;

export const CommitmentStatus = z.enum(['committed', 'verified', 'unverified', 'flagged']);
export type CommitmentStatus = z.infer<typeof CommitmentStatus>;

export const ReadingKind = z.enum(['rehearsal', 'before', 'after']);
export type ReadingKind = z.infer<typeof ReadingKind>;

export const CheckStatus = z.enum(['pass', 'flagged', 'rejected']);

/** Why a settled commitment earned nothing. Shown on the result card (NFR-U4). */
export const ResultReason = z.enum([
  'late_photo',
  'missing_photo',
  'failed_check',
  'no_measured_cut',
  'missing_ami_data',
]);
export type CheckStatus = z.infer<typeof CheckStatus>;

export type ResultReason = z.infer<typeof ResultReason>;

/** Why a reading failed a rule check. Flags go to the dashboard list for a person to review. */
export const ReadingFlag = z.enum([
  'late',
  'serial_mismatch',
  'too_far',
  'not_increasing',
  'implausible_draw',
  'duplicate_photo',
  'ocr_mismatch',
]);
export type ReadingFlag = z.infer<typeof ReadingFlag>;
