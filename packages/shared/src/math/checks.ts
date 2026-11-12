import { PHOTO_RULES } from '../constants';
import type { ReadingFlag, ReadingKind } from '../schemas/enums';
import { capKw } from './payout';

/**
 * Photo rule checks. All plain rules: no ML, no trained model.
 * A failed check flags the reading for a person to review on the dashboard.
 * Serial match, duplicate hash and OCR need the photo itself and live in apps/api.
 */

const MIN = 60_000;

/** Before photo: within 15 min of window start. After photo: within 30 min of window end. */
export function isPhotoOnTime(
  kind: Exclude<ReadingKind, 'rehearsal'>,
  serverReceivedAt: Date,
  windowStart: Date,
  windowEnd: Date,
): boolean {
  const t = serverReceivedAt.getTime();
  if (kind === 'before') {
    const start = windowStart.getTime();
    return t >= start && t <= start + PHOTO_RULES.beforeDeadlineMin * MIN;
  }
  const end = windowEnd.getTime();
  return t >= end && t <= end + PHOTO_RULES.afterDeadlineMin * MIN;
}

/**
 * The typed reading must be higher than the previous one, and not more than the
 * service could draw in that time.
 */
export function checkReadingValue(
  readingKwh: number,
  previousKwh: number,
  hoursSincePrevious: number,
  billAvgKwhMonth: number,
): ReadingFlag[] {
  const flags: ReadingFlag[] = [];
  if (readingKwh < previousKwh) flags.push('not_increasing');
  // TODO(team): replace with the service's rated capacity once we know what Meralco exposes.
  const maxPlausibleKwh = capKw(billAvgKwhMonth) * 4 * hoursSincePrevious;
  if (readingKwh - previousKwh > maxPlausibleKwh) flags.push('implausible_draw');
  return flags;
}

/** Great-circle distance in metres, for the GPS check against the registered address. */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}
