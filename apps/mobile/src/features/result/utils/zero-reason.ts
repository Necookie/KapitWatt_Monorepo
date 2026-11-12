import type { ZeroPayoutReason } from '@kapitwatt/shared';

/** Why a settled event verified nothing, in the mascot's words (NFR-U4). */
export const ZERO_REASON: Record<ZeroPayoutReason, string> = {
  late_photo: 'A meter photo came in after its deadline.',
  missing_photo: 'A meter photo was missing, so we could not verify your cut.',
  failed_check: 'A meter reading did not pass the checks.',
  no_measured_cut: 'Your meter showed no drop below your usual usage.',
  missing_ami_data: 'Smart-meter data for the window was missing.',
};
