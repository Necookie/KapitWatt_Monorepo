import type { CheckStatus, MeterType, ReadingFlag } from '@kapitwatt/shared';
import type { Db } from '../index';

/**
 * Queries behind the simulator's service account. EVERY statement here is restricted to rows with
 * is_simulated = true: the simulator can never read or change a real household. Writes are batched
 * (one statement per chunk) because each query is one Worker subrequest.
 */

const CHUNK = 400;
const chunks = <T>(items: T[]): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK));
  return out;
};

export async function countSimulated(
  db: Db,
): Promise<{ total: number; ami: number; photo: number }> {
  const [r] = await db`
    select count(*)::int as total,
           count(*) filter (where meter_type = 'ami')::int as ami,
           count(*) filter (where meter_type = 'standard')::int as photo
    from households where is_simulated`;
  return { total: Number(r?.total ?? 0), ami: Number(r?.ami ?? 0), photo: Number(r?.photo ?? 0) };
}

export interface NewSimulatedHousehold {
  id: string;
  barangayId: string;
  meterType: MeterType;
  meterSerial: string;
  billAvgKwhMonth: number;
  /** Stands in for the rehearsal (photo) or AMI history (smart meter). */
  baselineKw: number;
}

/**
 * Registers simulated households: opted in with a consent time like a real sign-up, but no token
 * (they can never authenticate), no push token and no address (no GPS check applies).
 */
export async function insertSimulatedHouseholds(
  db: Db,
  rows: NewSimulatedHousehold[],
): Promise<number> {
  let inserted = 0;
  for (const part of chunks(rows)) {
    const res = await db`
      insert into households (id, barangay_id, meter_type, meter_serial, bill_avg_kwh_month,
                              baseline_kw, opted_in, consent_at, is_simulated)
      select t.id, t.barangay_id, t.meter_type, t.meter_serial, t.bill, t.baseline,
             true, now(), true
      from unnest(${part.map((r) => r.id)}::uuid[], ${part.map((r) => r.barangayId)}::uuid[],
                  ${part.map((r) => r.meterType)}::text[], ${part.map((r) => r.meterSerial)}::text[],
                  ${part.map((r) => r.billAvgKwhMonth)}::numeric[], ${part.map((r) => r.baselineKw)}::numeric[])
             as t(id, barangay_id, meter_type, meter_serial, bill, baseline)
      returning id`;
    inserted += res.length;
  }
  return inserted;
}

/** Reset: simulated households only. Cascades remove their commitments, readings, intervals, rewards. */
export async function deleteSimulated(db: Db): Promise<number> {
  const res = await db`delete from households where is_simulated returning id`;
  return res.length;
}

export interface SimHouseholdRow {
  id: string;
  barangayId: string;
  meterType: MeterType;
  baselineKw: number;
  billAvgKwhMonth: number;
  lastReadingKwh: number;
  committedKw: number | null;
}

/**
 * Simulated, opted-in households with a baseline in the alert's target barangays, with their
 * commitment for this alert (if any) and their last photo reading. A household with no reading yet
 * gets a synthetic starting register value, so the fake meter has somewhere to start.
 */
export async function listSimHouseholdsForAlert(
  db: Db,
  alertId: string,
): Promise<SimHouseholdRow[]> {
  const rows = await db`
    select h.id, h.barangay_id, h.meter_type, h.baseline_kw, h.bill_avg_kwh_month,
           c.committed_kw,
           coalesce(last.reading_kwh, 1000 + h.bill_avg_kwh_month * 6) as last_reading
    from alerts a
    join households h on h.barangay_id = any(a.target_barangay_ids)
    left join commitments c on c.household_id = h.id and c.alert_id = a.id
    left join lateral (
      select m.reading_kwh from meter_readings m
      where m.household_id = h.id order by m.captured_at desc limit 1
    ) last on true
    where a.id = ${alertId} and h.is_simulated and h.opted_in and h.baseline_kw is not null`;
  return rows.map((r) => ({
    id: r.id as string,
    barangayId: r.barangay_id as string,
    meterType: r.meter_type as MeterType,
    baselineKw: Number(r.baseline_kw),
    billAvgKwhMonth: Number(r.bill_avg_kwh_month),
    lastReadingKwh: Number(r.last_reading),
    committedKw: r.committed_kw === null ? null : Number(r.committed_kw),
  }));
}

export interface SimPhotoReading {
  householdId: string;
  kind: 'before' | 'after';
  readingKwh: number;
  capturedAt: string;
  checkStatus: CheckStatus;
  flags: ReadingFlag[];
}

/**
 * Photo-path readings for simulated households that hold a commitment for this alert, while the
 * alert is still open (not settling, settled or cancelled). No photo file, so no key and no hash.
 * One reading per commitment and kind, as for phones: repeats are skipped.
 */
export async function insertSimPhotoReadings(
  db: Db,
  alertId: string,
  rows: SimPhotoReading[],
): Promise<number> {
  let inserted = 0;
  for (const part of chunks(rows)) {
    const res = await db`
      insert into meter_readings (household_id, commitment_id, kind, reading_kwh, captured_at,
                                  check_status, flags)
      select h.id, c.id, t.kind, t.kwh, t.captured_at, t.status,
             coalesce(string_to_array(nullif(t.flags, ''), ','), '{}')
      from unnest(${part.map((r) => r.householdId)}::uuid[], ${part.map((r) => r.kind)}::text[],
                  ${part.map((r) => r.readingKwh)}::numeric[], ${part.map((r) => r.capturedAt)}::timestamptz[],
                  ${part.map((r) => r.checkStatus)}::text[], ${part.map((r) => r.flags.join(','))}::text[])
             as t(household_id, kind, kwh, captured_at, status, flags)
      join households h on h.id = t.household_id and h.is_simulated
      join commitments c on c.household_id = h.id and c.alert_id = ${alertId} and c.path = 'photo'
      join alerts a on a.id = c.alert_id and a.status not in ('settling', 'settled', 'cancelled')
      on conflict (commitment_id, kind) do nothing
      returning id`;
    inserted += res.length;
  }
  return inserted;
}

/**
 * Smart-meter interval energy for simulated households with an AMI commitment to this alert
 * (the fake AMI feed). Repeated intervals are skipped.
 */
export async function insertSimAmiIntervals(
  db: Db,
  alertId: string,
  rows: { householdId: string; intervalStart: string; kwh: number }[],
): Promise<number> {
  let inserted = 0;
  for (const part of chunks(rows)) {
    const res = await db`
      insert into ami_intervals (household_id, interval_start, kwh, is_simulated)
      select h.id, t.interval_start, t.kwh, true
      from unnest(${part.map((r) => r.householdId)}::uuid[],
                  ${part.map((r) => r.intervalStart)}::timestamptz[], ${part.map((r) => r.kwh)}::numeric[])
             as t(household_id, interval_start, kwh)
      join households h on h.id = t.household_id and h.is_simulated
      join commitments c on c.household_id = h.id and c.alert_id = ${alertId} and c.path = 'ami'
      join alerts a on a.id = c.alert_id and a.status not in ('settling', 'settled', 'cancelled')
      on conflict (household_id, interval_start) do nothing
      returning id`;
    inserted += res.length;
  }
  return inserted;
}
