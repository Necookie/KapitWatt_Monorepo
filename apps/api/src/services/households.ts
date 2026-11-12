import {
  getHouseholdProfile,
  insertHousehold,
  insertSimulatedHouseholds,
  type NewSimulatedHousehold,
  updatePushToken,
  type Db,
  type HouseholdProfileRow,
} from '@kapitwatt/db';
import type {
  HouseholdMe,
  RegisterHouseholdInput,
  RegisterResult,
  VerificationPath,
} from '@kapitwatt/shared';
import { newHouseholdToken, sha256Hex, uuidFromName } from '../lib/crypto';
import { AppError, notFound } from '../lib/errors';
import { commitCapKw } from './cap';

/** A smart meter is verified from Meralco interval data; every other meter by in-app photos. */
export const pathFor = (meterType: 'ami' | 'standard'): VerificationPath =>
  meterType === 'ami' ? 'ami' : 'photo';

export function toHouseholdMe(p: HouseholdProfileRow): HouseholdMe {
  return {
    id: p.id,
    barangayId: p.barangayId,
    barangayName: p.barangayName,
    municipality: p.municipality,
    meterType: p.meterType,
    path: pathFor(p.meterType),
    meterSerial: p.meterSerial,
    billAvgKwhMonth: p.billAvgKwhMonth,
    baselineKw: p.baselineKw,
    needsRehearsal: p.meterType === 'standard' && p.baselineKw === null,
    rehearsalReadings: p.rehearsalReadings,
    trustScore: p.trustScore,
    commitCapKw: commitCapKw(p.baselineKw, p.billAvgKwhMonth, p.trustScore),
    optedIn: p.optedIn,
    points: p.points,
    creditPhp: Math.round(p.creditPhp * 100) / 100,
  };
}

/**
 * Sign-up and opt-in (FR-API-01). Consent is required by the schema (`consent: true`); the consent
 * time is the server's. The bearer token is returned once and only its hash is stored.
 */
export async function register(db: Db, input: RegisterHouseholdInput): Promise<RegisterResult> {
  const token = newHouseholdToken();
  const id = crypto.randomUUID();
  const created = await insertHousehold(db, {
    id,
    barangayId: input.barangayId,
    meterType: input.meterType,
    meterSerial: input.meterSerial,
    billAvgKwhMonth: input.billAvgKwhMonth,
    lat: input.lat,
    lng: input.lng,
    pushToken: input.pushToken ?? null,
    tokenHash: await sha256Hex(token),
  });
  if (!created) {
    throw new AppError(422, 'unknown_barangay', 'That barangay is not in the pilot.');
  }
  return { token, household: await me(db, id) };
}

/** The current household's profile, commit cap and totals (FR-API-04). */
export async function me(db: Db, householdId: string): Promise<HouseholdMe> {
  const profile = await getHouseholdProfile(db, householdId);
  if (!profile) throw notFound('Household');
  return toHouseholdMe(profile);
}

/** FR-API-03. */
export async function setPushToken(db: Db, householdId: string, pushToken: string): Promise<void> {
  await updatePushToken(db, householdId, pushToken);
}

/**
 * The simulator's registration path (via the sim port only, never over HTTP): simulated, opted-in
 * households with a seeded baseline standing in for the rehearsal or AMI history. They get no token,
 * so they can never call the API as a household. Ids derive from the seed and meter serial, so a
 * given seed always yields the same households in the same order: runs are repeatable.
 */
export async function registerSimulated(
  db: Db,
  seed: number,
  rows: Omit<NewSimulatedHousehold, 'id'>[],
): Promise<number> {
  const withIds = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      id: await uuidFromName(`kapitwatt-sim:${seed}:${r.meterSerial}`),
    })),
  );
  return insertSimulatedHouseholds(db, withIds);
}
