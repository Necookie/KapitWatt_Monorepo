import {
  getReadingCommitment,
  getReadingHousehold,
  getReadingPhotoKey,
  insertPhotoReading,
  photoHashExists,
  setHouseholdBaseline,
  type Db,
  type ReadingHousehold,
} from '@kapitwatt/db';
import {
  PHOTO_RULES,
  photoBaselineKw,
  REHEARSAL_MIN_MINUTES,
  type CheckStatus,
  type ReadingFlag,
  type SubmitReadingInput,
  type SubmitReadingResult,
} from '@kapitwatt/shared';
import { sha256Hex } from '../lib/crypto';
import { AppError, conflict, isUniqueViolation, notFound } from '../lib/errors';
import { assertValidPhoto, deletePhoto, storePhoto } from './photos';
import { evaluatePhotoReading } from './reading-checks';

const MIN_MS = 60_000;
const HOUR_MS = 3_600_000;
/** Value problems on a rehearsal reading are refused (retake it), not stored. */
const VALUE_FLAGS: ReadingFlag[] = ['not_increasing', 'implausible_draw'];

/**
 * Is a before/after photo inside its fixed window right now (on the alert's clock)?
 *   before: window start .. start + 15 min      after: window end .. end + 30 min
 * Outside it the upload is refused: a late photo earns nothing and cannot be resubmitted.
 */
export function photoWindowState(
  kind: 'before' | 'after',
  now: Date,
  windowStart: Date,
  windowEnd: Date,
): 'open' | 'not_open_yet' | 'deadline_passed' {
  const opens = kind === 'before' ? windowStart : windowEnd;
  const minutes = kind === 'before' ? PHOTO_RULES.beforeDeadlineMin : PHOTO_RULES.afterDeadlineMin;
  const closes = new Date(opens.getTime() + minutes * MIN_MS);
  if (now < opens) return 'not_open_yet';
  if (now > closes) return 'deadline_passed';
  return 'open';
}

const gpsOf = (h: ReadingHousehold, input: SubmitReadingInput) =>
  h.lat === null || h.lng === null
    ? null
    : { lat: input.lat, lng: input.lng, homeLat: h.lat, homeLng: h.lng };

interface Prepared {
  commitmentId: string | null;
  capturedAt: Date;
  checkStatus: CheckStatus;
  flags: ReadingFlag[];
  /** Set when this reading completes the rehearsal. */
  baselineKw: number | null;
}

/** Rehearsal (photo households, at sign-up): two readings at least REHEARSAL_MIN_MINUTES apart. */
function prepareRehearsal(h: ReadingHousehold, input: SubmitReadingInput, now: Date): Prepared {
  if (h.meterType === 'ami') {
    throw conflict('no_rehearsal_needed', 'Smart-meter households do not rehearse.');
  }
  if (h.baselineKw !== null || h.rehearsal.length >= 2) {
    throw conflict('already_rehearsed', 'The rehearsal is already done.');
  }
  const first = h.rehearsal[0] ?? null;
  if (first) {
    const minutes = (now.getTime() - first.at.getTime()) / MIN_MS;
    if (minutes < REHEARSAL_MIN_MINUTES) {
      const wait = Math.ceil(REHEARSAL_MIN_MINUTES - minutes);
      throw conflict(
        'rehearsal_too_short',
        `Take the second photo in ${wait} minute${wait === 1 ? '' : 's'}.`,
      );
    }
  }
  const { checkStatus, flags } = evaluatePhotoReading({
    kind: 'rehearsal',
    readingKwh: input.readingKwh,
    capturedAt: now,
    window: null,
    previous: first ?? h.previous,
    billAvgKwhMonth: h.billAvgKwhMonth,
    gps: gpsOf(h, input),
  });
  if (first && flags.some((f) => VALUE_FLAGS.includes(f))) {
    throw new AppError(
      422,
      'invalid_reading',
      'That reading does not fit your first one. Check it and try again.',
    );
  }
  const baselineKw = first
    ? photoBaselineKw(
        first.kwh,
        input.readingKwh,
        (now.getTime() - first.at.getTime()) / HOUR_MS,
        h.billAvgKwhMonth,
      )
    : null;
  return { commitmentId: null, capturedAt: now, checkStatus, flags, baselineKw };
}

/** Before/after photo for a photo-path commitment, inside its fixed window. */
async function prepareEventPhoto(
  db: Db,
  householdId: string,
  h: ReadingHousehold,
  input: SubmitReadingInput & { kind: 'before' | 'after' },
  isDemo: boolean,
): Promise<Prepared> {
  if (!input.alertId) {
    throw new AppError(400, 'invalid_request', 'alertId is required for before and after photos.');
  }
  const c = await getReadingCommitment(db, householdId, input.alertId, isDemo);
  if (!c) throw conflict('no_commitment', 'Commit a cut before sending photos.');
  if (c.path !== 'photo') {
    throw conflict('no_commitment', 'Smart-meter households do not send photos.');
  }
  if (['settling', 'settled', 'cancelled'].includes(c.alertStatus)) {
    throw conflict('alert_closed', 'This alert is closed.');
  }
  if (c.submitted.includes(input.kind)) {
    throw conflict('already_submitted', 'You already sent this photo.');
  }
  const state = photoWindowState(input.kind, c.effectiveNow, c.windowStart, c.windowEnd);
  if (state === 'not_open_yet')
    throw conflict('not_open_yet', 'This photo window is not open yet.');
  if (state === 'deadline_passed') {
    throw conflict('deadline_passed', 'The deadline for this photo has passed.');
  }
  const { checkStatus, flags } = evaluatePhotoReading({
    kind: input.kind,
    readingKwh: input.readingKwh,
    capturedAt: c.effectiveNow,
    window: { start: c.windowStart, end: c.windowEnd },
    previous: input.kind === 'after' ? (c.before ?? h.previous) : h.previous,
    billAvgKwhMonth: h.billAvgKwhMonth,
    gps: gpsOf(h, input),
  });
  return {
    commitmentId: c.commitmentId,
    capturedAt: c.effectiveNow,
    checkStatus,
    flags,
    baselineKw: null,
  };
}

/**
 * POST /readings (FR-API-30 to 40). Everything that can be refused is checked BEFORE the photo is
 * stored; if the database write is still refused, the stored photo is deleted again. Rule failures
 * that a person should judge (value, GPS) are stored as flagged; timing failures are refused.
 * Serial match needs OCR or a person: it is checked at review (no ML in the build).
 */
export async function submitReading(
  db: Db,
  bucket: R2Bucket,
  householdId: string,
  input: SubmitReadingInput,
  photo: Uint8Array,
  isDemo: boolean,
): Promise<SubmitReadingResult> {
  assertValidPhoto(photo);
  const household = await getReadingHousehold(db, householdId);
  if (!household) throw notFound('Household');
  const photoHash = await sha256Hex(photo);
  if (await photoHashExists(db, photoHash)) {
    throw conflict('duplicate_photo', 'This photo was already used. Take a new one.');
  }

  const prepared =
    input.kind === 'rehearsal'
      ? prepareRehearsal(household, input, new Date())
      : await prepareEventPhoto(db, householdId, household, { ...input, kind: input.kind }, isDemo);

  const id = crypto.randomUUID();
  const photoKey = await storePhoto(bucket, photo);
  try {
    const stored = await insertPhotoReading(db, {
      id,
      householdId,
      commitmentId: prepared.commitmentId,
      kind: input.kind,
      readingKwh: input.readingKwh,
      capturedAt: prepared.capturedAt,
      photoKey,
      photoHash,
      lat: input.lat,
      lng: input.lng,
      checkStatus: prepared.checkStatus,
      flags: prepared.flags,
    });
    if (!stored) throw conflict('alert_closed', 'This alert is closed.');
  } catch (err) {
    await deletePhoto(bucket, photoKey);
    if (isUniqueViolation(err, 'meter_readings_photo_hash_idx')) {
      throw conflict('duplicate_photo', 'This photo was already used. Take a new one.');
    }
    if (isUniqueViolation(err)) throw conflict('already_submitted', 'You already sent this photo.');
    throw err;
  }
  if (prepared.baselineKw !== null)
    await setHouseholdBaseline(db, householdId, prepared.baselineKw);

  return {
    id,
    kind: input.kind,
    checkStatus: prepared.checkStatus,
    flags: prepared.flags,
    baselineKw: prepared.baselineKw,
  };
}

/** Operator review: the photo bytes of a reading, from the private bucket. */
export async function readingPhoto(
  db: Db,
  bucket: R2Bucket,
  readingId: string,
): Promise<R2ObjectBody> {
  const key = await getReadingPhotoKey(db, readingId);
  const object = key ? await bucket.get(key) : null;
  if (!object) throw notFound('Photo');
  return object;
}
