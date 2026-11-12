import { describeError } from '@/api/http';

/** Refusals the household can act on; anything else shows the server's sentence. */
const COMMIT_REFUSALS: Record<string, string> = {
  already_committed: 'You already committed to this event.',
  window_closed: 'Commitments closed when the peak window started.',
  alert_closed: 'This event is over.',
  above_cap: 'That is above your maximum cut.',
  needs_rehearsal: 'Finish your practice run first, so we know your usual usage.',
  no_baseline: 'We do not have your usual usage yet, so you cannot commit.',
  opted_out: 'Grid alerts are turned off for you. Turn them on in Profile to join.',
  not_targeted: 'This alert is not for your barangay.',
};

export function commitError(e: Error): string {
  return describeError(e, COMMIT_REFUSALS, 'Could not save your commitment. Try again.');
}
