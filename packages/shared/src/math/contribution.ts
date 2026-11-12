import { CONTRIBUTION_BANDS, TRUST } from '../constants';

export type ContributionBand = (typeof CONTRIBUTION_BANDS)[number];

export interface ContributionStanding {
  band: ContributionBand;
  /** The next band up, or null at the top. */
  next: ContributionBand | null;
  /** Whole score points still needed to reach `next`; 0 at the top. */
  toNext: number;
}

/** The band a Contribution Score sits in, and how far the next one is. */
export function contributionStanding(score: number): ContributionStanding {
  let index = 0;
  CONTRIBUTION_BANDS.forEach((b, i) => {
    if (score >= b.minScore) index = i;
  });
  const band = CONTRIBUTION_BANDS[index]!;
  const next = CONTRIBUTION_BANDS[index + 1] ?? null;
  return { band, next, toNext: next ? Math.ceil(next.minScore - score) : 0 };
}

/**
 * How one settled event moves the Contribution Score (placeholder weights): a verified cut raises
 * it; a flagged or rejected reading, or a missing or late photo, lowers it. Missing smart-meter data
 * and a zero cut are not the household's doing and leave it alone. An alert the household never
 * committed to is not an event, so skipping one costs nothing.
 */
export function contributionDelta(verified: boolean, reason: string | null): number {
  if (verified) return TRUST.cleanEvent;
  switch (reason) {
    case 'failed_check':
      return TRUST.flaggedReading;
    case 'missing_photo':
    case 'late_photo':
      return TRUST.missedEvent;
    default:
      return 0;
  }
}
