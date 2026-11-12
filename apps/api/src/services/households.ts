import {
  deleteHousehold,
  findHouseholdByEmail,
  getHouseholdProfile,
  getPasswordHash,
  insertHousehold,
  insertSimulatedHouseholds,
  type NewSimulatedHousehold,
  setTokenHash,
  updateHouseholdProfile,
  updatePushToken,
  type Db,
  type HouseholdProfileRow,
} from '@kapitwatt/db';
import type {
  HouseholdMe,
  LoginInput,
  RegisterHouseholdInput,
  RegisterResult,
  UpdateProfileInput,
  VerificationPath,
} from '@kapitwatt/shared';
import {
  hashPassword,
  newHouseholdToken,
  sha256Hex,
  uuidFromName,
  verifyPassword,
} from '../lib/crypto';
import { AppError, conflict, isUniqueViolation, notFound } from '../lib/errors';
import { deletePhoto } from './photos';
import { commitCapKw } from './cap';

/** A smart meter is verified from Meralco interval data; every other meter by in-app photos. */
export const pathFor = (meterType: 'ami' | 'standard'): VerificationPath =>
  meterType === 'ami' ? 'ami' : 'photo';

/** The account number as the household sees it: every digit hidden except the last four. */
export const maskAccountNumber = (accountNumber: string): string =>
  '•'.repeat(Math.max(0, accountNumber.length - 4)) + accountNumber.slice(-4);

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
    email: p.email,
    accountName: p.accountName,
    accountNumberMasked: p.accountNumber === null ? null : maskAccountNumber(p.accountNumber),
    serviceAddress: p.serviceAddress,
    consentAt: p.consentAt?.toISOString() ?? null,
  };
}

/**
 * Sign-up and opt-in (FR-API-01). Both consents are required by the schema (`consent` and
 * `alertsConsent` must be true); the consent time is the server's. The bearer token is returned
 * once and only its hash is stored; the password is stored only as a PBKDF2 hash. One login per
 * email and one household per Meralco account number.
 */
export async function register(db: Db, input: RegisterHouseholdInput): Promise<RegisterResult> {
  const token = newHouseholdToken();
  const id = crypto.randomUUID();
  let created: boolean;
  try {
    created = await insertHousehold(db, {
      id,
      barangayId: input.barangayId,
      meterType: input.meterType,
      meterSerial: input.meterSerial,
      billAvgKwhMonth: input.billAvgKwhMonth,
      lat: input.lat,
      lng: input.lng,
      pushToken: input.pushToken ?? null,
      tokenHash: await sha256Hex(token),
      email: input.email,
      passwordHash: await hashPassword(input.password),
      accountNumber: input.accountNumber,
      accountName: input.accountName,
      serviceAddress: input.serviceAddress,
    });
  } catch (err) {
    if (isUniqueViolation(err, 'households_email_key')) {
      throw conflict('email_taken', 'That email already has an account. Log in instead.');
    }
    if (isUniqueViolation(err, 'households_account_number_key')) {
      throw conflict('account_taken', 'That Meralco account is already enrolled.');
    }
    throw err;
  }
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

/**
 * Log in with email and password. An unknown email and a wrong password get the same answer. A new
 * bearer token replaces the old one, so a household is signed in on one phone at a time.
 */
export async function login(db: Db, input: LoginInput): Promise<RegisterResult> {
  const found = await findHouseholdByEmail(db, input.email);
  const ok = found !== null && (await verifyPassword(input.password, found.passwordHash));
  if (!found || !ok) {
    throw new AppError(401, 'invalid_credentials', 'Wrong email or password.');
  }
  const token = newHouseholdToken();
  await setTokenHash(db, found.id, await sha256Hex(token));
  return { token, household: await me(db, found.id) };
}

/** Log out: the token stops working at once. */
export async function logout(db: Db, householdId: string): Promise<void> {
  await setTokenHash(db, householdId, null);
}

/** Correct the account holder name or service address, or turn grid alerts off and on. */
export async function updateProfile(
  db: Db,
  householdId: string,
  input: UpdateProfileInput,
): Promise<HouseholdMe> {
  await updateHouseholdProfile(db, householdId, input);
  return me(db, householdId);
}

/**
 * Withdraw consent and erase the household (Data Privacy Act 2012): the profile, commitments,
 * readings and rewards go, and its meter photos are removed from the private bucket. The password
 * confirms it; a household from before passwords existed confirms with its token alone.
 */
export async function deleteAccount(
  db: Db,
  bucket: R2Bucket | undefined,
  householdId: string,
  password: string,
): Promise<void> {
  const stored = await getPasswordHash(db, householdId);
  if (stored !== null && !(await verifyPassword(password, stored))) {
    throw new AppError(401, 'invalid_credentials', 'Wrong password.');
  }
  const photoKeys = await deleteHousehold(db, householdId);
  if (bucket) await Promise.all(photoKeys.map((key) => deletePhoto(bucket, key)));
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
