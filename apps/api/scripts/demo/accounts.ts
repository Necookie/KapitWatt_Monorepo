/**
 * The ten demo households the team logs into on the phones. Demo only.
 *
 * Every name, address and account number here is made up; none belongs to a real Meralco customer.
 * A missing account is registered through POST /auth/register, the same path a phone uses. Then each
 * one is marked is_demo and put in the presenter's barangay (Bagumbayan, Santa Cruz) with its baseline,
 * standing in for the practice run (two meter photos 30 minutes apart). Household 10 is left without
 * one, to demo the practice run.
 */
import { listBarangays, setDemoHousehold, type Db } from '@kapitwatt/db';
import {
  ApiErrorBody,
  HUB_TOWN,
  PILOT_BARANGAYS,
  RegisterResult,
  type MeterType,
} from '@kapitwatt/shared';

export const DEMO_EMAIL_DOMAIN = 'kapitwatt.test';
export const DEMO_SERIAL_PREFIX = 'DEMO-';
export const DEFAULT_DEMO_PASSWORD = 'KapitWatt-Demo-2026';
/**
 * Where the demo is held: Ortigas, Pasig (near Meralco Center). The ten accounts are registered here so
 * meter photos taken at the venue pass the GPS check (within GPS_MAX_DISTANCE_M). Their address text
 * stays in Bagumbayan: only the photo location moves. Override with DEMO_LAT and DEMO_LNG.
 */
export const DEMO_VENUE = { lat: 14.5906, lng: 121.0671 } as const;
/** The presenter's barangay: every demo account lives here, and the live event is set up around it. */
export const DEMO_BARANGAY = PILOT_BARANGAYS[HUB_TOWN][0];

interface DemoAccount {
  name: string;
  street: string;
  meterType: MeterType;
  billAvgKwhMonth: number;
  /** null: the household still has to do the practice run. */
  baselineKw: number | null;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    name: 'Maria Santos',
    street: '12 Rizal Street',
    meterType: 'standard',
    billAvgKwhMonth: 450,
    baselineKw: 1.9,
  },
  {
    name: 'Jose Reyes',
    street: '45 Mabini Street',
    meterType: 'standard',
    billAvgKwhMonth: 520,
    baselineKw: 2.1,
  },
  {
    name: 'Ana Dela Cruz',
    street: '8 Bonifacio Street',
    meterType: 'standard',
    billAvgKwhMonth: 380,
    baselineKw: 1.6,
  },
  {
    name: 'Ramon Garcia',
    street: '27 Luna Street',
    meterType: 'standard',
    billAvgKwhMonth: 610,
    baselineKw: 2.4,
  },
  {
    name: 'Liza Mendoza',
    street: '3 Del Pilar Street',
    meterType: 'standard',
    billAvgKwhMonth: 300,
    baselineKw: 1.3,
  },
  {
    name: 'Carlo Bautista',
    street: '61 Burgos Street',
    meterType: 'standard',
    billAvgKwhMonth: 480,
    baselineKw: 1.8,
  },
  {
    name: 'Grace Villanueva',
    street: '19 Quezon Avenue',
    meterType: 'standard',
    billAvgKwhMonth: 420,
    baselineKw: 1.7,
  },
  {
    name: 'Mark Aquino',
    street: '5 Osmena Street',
    meterType: 'ami',
    billAvgKwhMonth: 560,
    baselineKw: 2.2,
  },
  {
    name: 'Jenny Ramos',
    street: '33 Roxas Street',
    meterType: 'ami',
    billAvgKwhMonth: 640,
    baselineKw: 2.6,
  },
  {
    name: 'Paolo Castillo',
    street: '14 Aguinaldo Street',
    meterType: 'standard',
    billAvgKwhMonth: 450,
    baselineKw: null,
  },
];

const number = (i: number) => String(i + 1).padStart(2, '0');
export const demoEmail = (i: number) => `demo${number(i)}@${DEMO_EMAIL_DOMAIN}`;
/** Ten digits starting 90000000: plainly a placeholder. */
const accountNumberOf = (i: number) => `90000000${number(i)}`;
const serialOf = (i: number) => `${DEMO_SERIAL_PREFIX}${String(i + 1).padStart(4, '0')}`;

export interface DemoAccountsConfig {
  api: string;
  db: Db;
  password: string;
  /** Where the demo is held: meter photos are checked against it (GPS_MAX_DISTANCE_M). */
  lat: number;
  lng: number;
  log?: (line: string) => void;
}

async function post(api: string, path: string, body: unknown) {
  const res = await fetch(`${api}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, json: text ? (JSON.parse(text) as unknown) : null };
}

/** Creates the missing accounts and puts all ten where the demo wants them. Safe to re-run. */
export async function ensureDemoAccounts(c: DemoAccountsConfig): Promise<void> {
  const log = c.log ?? console.log;
  if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng))
    throw new Error('DEMO_LAT / DEMO_LNG invalid');
  const barangay = (await listBarangays(c.db)).find(
    (b) => b.municipality === HUB_TOWN && b.name === DEMO_BARANGAY,
  );
  if (!barangay)
    throw new Error(`barangay ${DEMO_BARANGAY}, ${HUB_TOWN} is not seeded (pnpm db:seed)`);

  const existing = new Set(
    (
      await c.db`select email from households
                 where email like ${`demo%@${DEMO_EMAIL_DOMAIN}`} and not is_simulated`
    ).map((r) => r.email as string),
  );

  for (const [i, a] of DEMO_ACCOUNTS.entries()) {
    const email = demoEmail(i);
    const serviceAddress = `${a.street}, ${barangay.name}`;
    let state = 'already there';
    if (!existing.has(email)) {
      const signup = {
        email,
        password: c.password,
        accountNumber: accountNumberOf(i),
        accountName: a.name,
        serviceAddress,
        barangayId: barangay.id,
        meterType: a.meterType,
        meterSerial: serialOf(i),
        billAvgKwhMonth: a.billAvgKwhMonth,
        lat: c.lat,
        lng: c.lng,
        consent: true,
        alertsConsent: true,
      };
      let res = await post(c.api, '/auth/register', signup);
      if (res.status === 429) {
        // Sign-up is rate-limited per IP; ten in a row can reach the limit.
        log('  rate limited, waiting a minute...');
        await new Promise((r) => setTimeout(r, 61_000));
        res = await post(c.api, '/auth/register', signup);
      }
      if (res.status === 201) {
        RegisterResult.parse(res.json);
        state = 'created';
      } else if (res.status === 409) {
        throw new Error(`${email}: ${ApiErrorBody.parse(res.json).error.code}`);
      } else {
        throw new Error(`${email}: HTTP ${res.status} ${JSON.stringify(res.json)}`);
      }
    }
    // Stands in for the practice run (photo) or the interval history (smart meter).
    const id = await setDemoHousehold(c.db, email, {
      barangayId: barangay.id,
      serviceAddress,
      baselineKw: a.baselineKw,
      lat: c.lat,
      lng: c.lng,
    });
    if (!id) {
      throw new Error(
        `${email}: not in this database with a DEMO- meter serial. If it was just registered, ` +
          'API_URL points at an API on another database.',
      );
    }
    const ready = a.baselineKw === null ? 'needs practice run' : `baseline ${a.baselineKw} kW`;
    const meter = a.meterType === 'ami' ? 'smart meter' : 'photo';
    log(`  ${email}  ${a.name.padEnd(17)} ${meter.padEnd(11)} ${ready}  (${state})`);
  }
}

/** Deletes all ten. */
export async function removeDemoAccounts(db: Db): Promise<number> {
  const gone = await db`
    delete from households
    where email like ${`demo%@${DEMO_EMAIL_DOMAIN}`} and meter_serial like ${`${DEMO_SERIAL_PREFIX}%`}
      and is_demo and not is_simulated
    returning email`;
  return gone.length;
}
