import {
  checkReadingValue,
  distanceMeters,
  GPS_MAX_DISTANCE_M,
  isPhotoOnTime,
  type CheckStatus,
  type ReadingFlag,
  type ReadingKind,
} from '@kapitwatt/shared';

const HOUR_MS = 3_600_000;

export interface PhotoReadingFacts {
  kind: ReadingKind;
  readingKwh: number;
  /** The alert's effective time at upload (server time plus the demo offset). */
  capturedAt: Date;
  /** null for the rehearsal, which has no alert window. */
  window: { start: Date; end: Date } | null;
  /** The household's previous reading, if any. */
  previous: { kwh: number; at: Date } | null;
  billAvgKwhMonth: number;
  /** Where the photo was taken vs the registered address; null when either is unknown. */
  gps: { lat: number; lng: number; homeLat: number; homeLng: number } | null;
}

/**
 * The plain-rule checks on a photo reading (no ML, no model). One place for real phones and the
 * simulator, so both are judged the same way:
 *   late             before photo outside window start .. +15 min, after photo outside end .. +30 min
 *   not_increasing   lower than the previous reading
 *   implausible_draw more than the service could have drawn since the previous reading
 *   too_far          taken more than GPS_MAX_DISTANCE_M from the registered address
 * Serial match and duplicate photos need the image itself and are handled by the upload path.
 */
export function evaluatePhotoReading(r: PhotoReadingFacts): {
  checkStatus: CheckStatus;
  flags: ReadingFlag[];
} {
  const flags: ReadingFlag[] = [];
  if (r.kind !== 'rehearsal' && r.window) {
    if (!isPhotoOnTime(r.kind, r.capturedAt, r.window.start, r.window.end)) flags.push('late');
  }
  if (r.previous) {
    const hours = (r.capturedAt.getTime() - r.previous.at.getTime()) / HOUR_MS;
    if (hours > 0) {
      flags.push(...checkReadingValue(r.readingKwh, r.previous.kwh, hours, r.billAvgKwhMonth));
    } else if (r.readingKwh < r.previous.kwh) {
      // No elapsed time to judge a draw against. This only happens in the demo, where each alert has
      // its own fast-forward clock, so a later alert's reading can carry an earlier time. The
      // "must not go down" rule still applies.
      flags.push('not_increasing');
    }
  }
  if (
    r.gps &&
    distanceMeters(r.gps.lat, r.gps.lng, r.gps.homeLat, r.gps.homeLng) > GPS_MAX_DISTANCE_M
  ) {
    flags.push('too_far');
  }
  return { checkStatus: flags.length ? 'flagged' : 'pass', flags };
}
