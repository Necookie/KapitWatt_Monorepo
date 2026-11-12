import type { MeterType } from '@kapitwatt/shared';
import type { Db } from '../index';

/**
 * Resolves a household from the SHA-256 hash of its bearer token. The raw token never reaches the
 * database. Returns null for an unknown token. Simulated households have no token and can't log in.
 */
export async function findHouseholdByTokenHash(
  db: Db,
  tokenHash: string,
): Promise<{ id: string; optedIn: boolean } | null> {
  const [row] = await db`
    select id, opted_in from households
    where auth_token_hash = ${tokenHash} and not is_simulated`;
  return row ? { id: row.id as string, optedIn: row.opted_in as boolean } : null;
}

export interface NewHousehold {
  id: string;
  barangayId: string;
  meterType: MeterType;
  meterSerial: string;
  billAvgKwhMonth: number;
  lat: number;
  lng: number;
  pushToken: string | null;
  tokenHash: string;
}

/**
 * Registers a real household: opted in, consent time and token issue time from the server clock.
 * One atomic request: a push token already held by another household (a phone that signed up again)
 * is released first, so one phone never gets the same alert twice. Returns false when the barangay
 * does not exist, in which case nothing is written.
 */
export async function insertHousehold(db: Db, h: NewHousehold): Promise<boolean> {
  const [, inserted] = await db.transaction([
    db`update households set push_token = null
       where ${h.pushToken}::text is not null and push_token = ${h.pushToken}`,
    db`insert into households
         (id, barangay_id, auth_token_hash, token_created_at, push_token, meter_type, meter_serial,
          bill_avg_kwh_month, opted_in, consent_at, lat, lng, is_simulated)
       select ${h.id}, b.id, ${h.tokenHash}, now(), ${h.pushToken}, ${h.meterType}, ${h.meterSerial},
              ${h.billAvgKwhMonth}, true, now(), ${h.lat}, ${h.lng}, false
       from barangays b where b.id = ${h.barangayId}
       returning id`,
  ]);
  return (inserted?.length ?? 0) === 1;
}

/** Stores or refreshes a household's Expo push token, releasing it from any other household. */
export async function updatePushToken(
  db: Db,
  householdId: string,
  pushToken: string,
): Promise<void> {
  await db.transaction([
    db`update households set push_token = null where push_token = ${pushToken} and id <> ${householdId}`,
    db`update households set push_token = ${pushToken} where id = ${householdId}`,
  ]);
}

export interface HouseholdProfileRow {
  id: string;
  barangayId: string;
  barangayName: string;
  municipality: string;
  meterType: MeterType;
  meterSerial: string;
  billAvgKwhMonth: number;
  baselineKw: number | null;
  trustScore: number;
  optedIn: boolean;
  rehearsalReadings: number;
  points: number;
  creditPhp: number;
}

/** The household's own profile with its rehearsal progress and reward totals. One query. */
export async function getHouseholdProfile(
  db: Db,
  householdId: string,
): Promise<HouseholdProfileRow | null> {
  const [r] = await db`
    select h.id, h.barangay_id, b.name as barangay_name, b.municipality, h.meter_type, h.meter_serial,
           h.bill_avg_kwh_month, h.baseline_kw, h.trust_score, h.opted_in,
           (select count(*)::int from meter_readings m
             where m.household_id = h.id and m.kind = 'rehearsal' and m.check_status <> 'rejected')
             as rehearsal_readings,
           coalesce((select sum(r.points)::int from rewards r
             join commitments c on c.id = r.commitment_id where c.household_id = h.id), 0) as points,
           coalesce((select sum(r.credit_php + r.bonus_php) from rewards r
             join commitments c on c.id = r.commitment_id where c.household_id = h.id), 0) as credit_php
    from households h
    join barangays b on b.id = h.barangay_id
    where h.id = ${householdId}`;
  if (!r) return null;
  return {
    id: r.id as string,
    barangayId: r.barangay_id as string,
    barangayName: r.barangay_name as string,
    municipality: r.municipality as string,
    meterType: r.meter_type as MeterType,
    meterSerial: r.meter_serial as string,
    // numeric columns arrive as strings over the HTTP driver
    billAvgKwhMonth: Number(r.bill_avg_kwh_month),
    baselineKw: r.baseline_kw === null ? null : Number(r.baseline_kw),
    trustScore: Number(r.trust_score),
    optedIn: r.opted_in as boolean,
    rehearsalReadings: Number(r.rehearsal_readings),
    points: Number(r.points),
    creditPhp: Number(r.credit_php),
  };
}
