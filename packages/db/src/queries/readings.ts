import type {
  CheckStatus,
  MeterType,
  ReadingFlag,
  ReadingKind,
  VerificationPath,
} from '@kapitwatt/shared';
import type { Db } from '../index';

/** What the upload path needs to know about the household before it accepts a photo. */
export interface ReadingHousehold {
  meterType: MeterType;
  baselineKw: number | null;
  billAvgKwhMonth: number;
  lat: number | null;
  lng: number | null;
  /** The household's latest reading (any kind), for the "must be higher" check. */
  previous: { kwh: number; at: Date } | null;
  /** Rehearsal readings that were not rejected, oldest first. */
  rehearsal: { kwh: number; at: Date }[];
}

export async function getReadingHousehold(
  db: Db,
  householdId: string,
): Promise<ReadingHousehold | null> {
  const [r] = await db`
    select h.meter_type, h.baseline_kw, h.bill_avg_kwh_month, h.lat, h.lng,
           last.reading_kwh as prev_kwh, last.captured_at as prev_at,
           coalesce((
             select json_agg(json_build_object('kwh', m.reading_kwh, 'at', m.captured_at)
                             order by m.captured_at)
             from meter_readings m
             where m.household_id = h.id and m.kind = 'rehearsal' and m.check_status <> 'rejected'
           ), '[]'::json) as rehearsal
    from households h
    left join lateral (
      select m.reading_kwh, m.captured_at from meter_readings m
      where m.household_id = h.id order by m.captured_at desc limit 1
    ) last on true
    where h.id = ${householdId} and not h.is_simulated`;
  if (!r) return null;
  return {
    meterType: r.meter_type as MeterType,
    baselineKw: r.baseline_kw === null ? null : Number(r.baseline_kw),
    billAvgKwhMonth: Number(r.bill_avg_kwh_month),
    lat: r.lat === null ? null : Number(r.lat),
    lng: r.lng === null ? null : Number(r.lng),
    previous: r.prev_kwh === null ? null : { kwh: Number(r.prev_kwh), at: r.prev_at as Date },
    rehearsal: (r.rehearsal as { kwh: string | number; at: string }[]).map((x) => ({
      kwh: Number(x.kwh),
      at: new Date(x.at),
    })),
  };
}

/** The household's commitment for an alert and the alert's window, on the alert's clock. */
export interface ReadingCommitment {
  commitmentId: string;
  path: VerificationPath;
  alertStatus: string;
  windowStart: Date;
  windowEnd: Date;
  effectiveNow: Date;
  /** Kinds already submitted for this commitment (no resubmission). */
  submitted: ReadingKind[];
  before: { kwh: number; at: Date } | null;
}

export async function getReadingCommitment(
  db: Db,
  householdId: string,
  alertId: string,
  isDemo: boolean,
): Promise<ReadingCommitment | null> {
  const [r] = await db`
    select c.id, c.path, a.status, a.window_start, a.window_end,
           now() + make_interval(secs => case when ${isDemo} then a.clock_offset_sec else 0 end)
             as effective_now,
           coalesce((select array_agg(m.kind) from meter_readings m where m.commitment_id = c.id),
                    '{}') as submitted,
           b.reading_kwh as before_kwh, b.captured_at as before_at
    from commitments c
    join alerts a on a.id = c.alert_id
    left join meter_readings b on b.commitment_id = c.id and b.kind = 'before'
    where c.household_id = ${householdId} and c.alert_id = ${alertId}`;
  if (!r) return null;
  return {
    commitmentId: r.id as string,
    path: r.path as VerificationPath,
    alertStatus: r.status as string,
    windowStart: r.window_start as Date,
    windowEnd: r.window_end as Date,
    effectiveNow: r.effective_now as Date,
    submitted: r.submitted as ReadingKind[],
    before:
      r.before_kwh === null || r.before_kwh === undefined
        ? null
        : { kwh: Number(r.before_kwh), at: r.before_at as Date },
  };
}

export async function photoHashExists(db: Db, hash: string): Promise<boolean> {
  const [r] = await db`select 1 from meter_readings where photo_hash = ${hash}`;
  return r !== undefined;
}

export interface NewPhotoReading {
  id: string;
  householdId: string;
  /** null for the rehearsal. */
  commitmentId: string | null;
  kind: ReadingKind;
  readingKwh: number;
  /** The alert's effective time (rehearsal: server time). */
  capturedAt: Date;
  photoKey: string;
  photoHash: string;
  lat: number;
  lng: number;
  checkStatus: CheckStatus;
  flags: ReadingFlag[];
}

/**
 * Stores a phone's photo reading. Event readings are only written while the alert is still open
 * (not settling, settled or cancelled), checked in the same statement. Returns false when that guard
 * refused the write. Unique violations (one per commitment and kind, duplicate photo hash) are
 * thrown for the caller to map.
 */
export async function insertPhotoReading(db: Db, r: NewPhotoReading): Promise<boolean> {
  const rows = await db`
    insert into meter_readings (id, household_id, commitment_id, kind, reading_kwh, captured_at,
                                photo_key, photo_hash, lat, lng, check_status, flags)
    select ${r.id}, ${r.householdId}, ${r.commitmentId}, ${r.kind}, ${r.readingKwh},
           ${r.capturedAt.toISOString()}, ${r.photoKey}, ${r.photoHash}, ${r.lat}, ${r.lng},
           ${r.checkStatus}, ${r.flags}::text[]
    where ${r.commitmentId}::uuid is null or exists (
      select 1 from commitments c join alerts a on a.id = c.alert_id
      where c.id = ${r.commitmentId}::uuid and a.status not in ('settling', 'settled', 'cancelled'))
    returning id`;
  return rows.length === 1;
}

/** The rehearsal measured the household's baseline (photo path). */
export async function setHouseholdBaseline(db: Db, householdId: string, kw: number): Promise<void> {
  await db`update households set baseline_kw = ${kw} where id = ${householdId} and baseline_kw is null`;
}

/** The R2 key of a reading's photo (operator review). */
export async function getReadingPhotoKey(db: Db, readingId: string): Promise<string | null> {
  const [r] = await db`select photo_key from meter_readings where id = ${readingId}`;
  return (r?.photo_key as string | null | undefined) ?? null;
}
