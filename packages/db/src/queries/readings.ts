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

export interface ReadingByHash {
  id: string;
  householdId: string;
  kind: ReadingKind;
  /** null for the rehearsal. */
  alertId: string | null;
  checkStatus: CheckStatus;
  flags: ReadingFlag[];
}

/**
 * The reading that already holds this photo, if any. The caller tells a reused photo (refused)
 * from a phone resending the same upload after a lost response (answered with the stored result).
 */
export async function findReadingByHash(db: Db, hash: string): Promise<ReadingByHash | null> {
  const [r] = await db`
    select m.id, m.household_id, m.kind, c.alert_id, m.check_status, m.flags
    from meter_readings m left join commitments c on c.id = m.commitment_id
    where m.photo_hash = ${hash}`;
  if (!r) return null;
  return {
    id: r.id as string,
    householdId: r.household_id as string,
    kind: r.kind as ReadingKind,
    alertId: (r.alert_id as string | null) ?? null,
    checkStatus: r.check_status as CheckStatus,
    flags: (r.flags as ReadingFlag[]) ?? [],
  };
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

// ---- P1: flagged readings and review ----------------------------------------------------------

export interface FlaggedReadingRow {
  id: string;
  alertId: string | null;
  barangayName: string;
  municipality: string;
  meterSerial: string;
  kind: ReadingKind;
  readingKwh: number;
  previousKwh: number | null;
  capturedAt: Date;
  flags: ReadingFlag[];
  hasPhoto: boolean;
}

/** Readings waiting for a person (check_status = flagged), newest first, with the reading before. */
export async function listFlaggedReadings(db: Db, limit: number): Promise<FlaggedReadingRow[]> {
  const rows = await db`
    select m.id, c.alert_id, b.name as barangay_name, b.municipality, h.meter_serial, m.kind,
           m.reading_kwh, m.captured_at, m.flags, m.photo_key is not null as has_photo,
           -- For an after photo, compare with the same commitment's before photo; otherwise the
           -- household's latest earlier reading.
           coalesce(
             (select b.reading_kwh from meter_readings b
              where m.kind = 'after' and b.commitment_id = m.commitment_id and b.kind = 'before'),
             prev.reading_kwh
           ) as previous_kwh
    from meter_readings m
    join households h on h.id = m.household_id
    join barangays b on b.id = h.barangay_id
    left join commitments c on c.id = m.commitment_id
    left join lateral (
      select p.reading_kwh from meter_readings p
      where p.household_id = m.household_id and p.captured_at < m.captured_at and p.id <> m.id
      order by p.captured_at desc limit 1
    ) prev on true
    where m.check_status = 'flagged'
    order by m.captured_at desc
    limit ${limit}`;
  return rows.map((r) => ({
    id: r.id as string,
    alertId: (r.alert_id as string | null) ?? null,
    barangayName: r.barangay_name as string,
    municipality: r.municipality as string,
    meterSerial: r.meter_serial as string,
    kind: r.kind as ReadingKind,
    readingKwh: Number(r.reading_kwh),
    previousKwh: r.previous_kwh === null ? null : Number(r.previous_kwh),
    capturedAt: r.captured_at as Date,
    flags: r.flags as ReadingFlag[],
    hasPhoto: r.has_photo as boolean,
  }));
}

export interface ReviewTarget {
  readingId: string;
  checkStatus: CheckStatus;
  commitmentId: string | null;
  householdId: string;
  alertId: string | null;
  alertStatus: string | null;
  barangayId: string;
}

export async function getReviewTarget(db: Db, readingId: string): Promise<ReviewTarget | null> {
  const [r] = await db`
    select m.id, m.check_status, m.commitment_id, m.household_id, c.alert_id, a.status as alert_status,
           h.barangay_id
    from meter_readings m
    join households h on h.id = m.household_id
    left join commitments c on c.id = m.commitment_id
    left join alerts a on a.id = c.alert_id
    where m.id = ${readingId}`;
  if (!r) return null;
  return {
    readingId: r.id as string,
    checkStatus: r.check_status as CheckStatus,
    commitmentId: (r.commitment_id as string | null) ?? null,
    householdId: r.household_id as string,
    alertId: (r.alert_id as string | null) ?? null,
    alertStatus: (r.alert_status as string | null) ?? null,
    barangayId: r.barangay_id as string,
  };
}

/**
 * Records a person's decision on a flagged reading: approve (pass) or reject. Only flagged readings
 * change, and never while their alert is mid-settlement. Returns false when nothing was updated.
 */
export async function recordReview(
  db: Db,
  readingId: string,
  decision: 'approve' | 'reject',
  reviewer: string,
): Promise<boolean> {
  const rows = await db`
    update meter_readings m
    set check_status = case when ${decision} = 'approve' then 'pass' else 'rejected' end,
        reviewed_by = ${reviewer}, reviewed_at = now()
    where m.id = ${readingId} and m.check_status = 'flagged'
      and not exists (
        select 1 from commitments c join alerts a on a.id = c.alert_id
        where c.id = m.commitment_id and a.status = 'settling')
    returning m.id`;
  return rows.length === 1;
}

/** Sum of verified kWh of an alert's commitments in one barangay, leaving one commitment out. */
export async function verifiedKwhInBarangay(
  db: Db,
  alertId: string,
  barangayId: string,
  excludeCommitmentId: string,
): Promise<number> {
  const [r] = await db`
    select coalesce(sum(c.verified_kwh), 0) as kwh
    from commitments c join households h on h.id = c.household_id
    where c.alert_id = ${alertId} and h.barangay_id = ${barangayId}
      and c.status = 'verified' and c.id <> ${excludeCommitmentId}`;
  return Number(r?.kwh ?? 0);
}

/**
 * Settles one commitment again after a review on a settled alert, atomically: the commitment, its
 * reward (replaced), the household's trust, and, when the barangay now reaches its target, the bonus
 * for every verified household there that did not have it yet.
 */
export async function writeReviewResettlement(
  db: Db,
  r: {
    alertId: string;
    barangayId: string;
    commitmentId: string;
    householdId: string;
    status: string;
    actualKw: number | null;
    verifiedKwh: number;
    resultReason: string | null;
    creditPhp: number;
    bonusPhp: number;
    points: number;
    trustDelta: number;
    barangayHit: boolean;
    bonusRate: number;
    trustMin: number;
    trustMax: number;
  },
): Promise<void> {
  await db.transaction([
    db`update commitments set status = ${r.status}, actual_kw = ${r.actualKw},
         verified_kwh = ${r.verifiedKwh}, result_reason = ${r.resultReason}
       where id = ${r.commitmentId}`,
    db`insert into rewards (commitment_id, credit_php, bonus_php, points)
       values (${r.commitmentId}, ${r.creditPhp}, ${r.bonusPhp}, ${r.points})
       on conflict (commitment_id) do update
         set credit_php = excluded.credit_php, bonus_php = excluded.bonus_php, points = excluded.points`,
    db`update households set trust_score = least(${r.trustMax}, greatest(${r.trustMin}, trust_score + ${r.trustDelta}))
       where id = ${r.householdId} and ${r.trustDelta}::numeric <> 0`,
    db`update rewards rw set bonus_php = round(rw.credit_php * ${r.bonusRate}::numeric, 2)
       from commitments c join households h on h.id = c.household_id
       where ${r.barangayHit} and rw.commitment_id = c.id and c.alert_id = ${r.alertId}
         and h.barangay_id = ${r.barangayId} and c.status = 'verified'
         and rw.bonus_php = 0 and rw.credit_php > 0`,
  ]);
}
