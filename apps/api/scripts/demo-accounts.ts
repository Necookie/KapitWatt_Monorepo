/**
 * Creates the ten demo households the team logs into on the phones. Demo only.
 *
 *   pnpm demo:accounts              create the missing ones (safe to re-run)
 *   pnpm demo:accounts -- --remove  delete all ten
 *
 * Every name, address and account number here is made up; none belongs to a real Meralco customer.
 * Each household is registered through POST /auth/register, the same path a phone uses. The one
 * shortcut is the baseline: it is written directly, standing in for the practice run, which needs
 * two meter photos 30 minutes apart. Household 10 is left without one, to demo the practice run.
 *
 * Environment (from Doppler): API_URL, DATABASE_URL. Optional:
 *   DEMO_PASSWORD        the password of all ten accounts (default below)
 *   DEMO_LAT, DEMO_LNG   where the demo is held. Meter photos are checked against this location
 *                        (within GPS_MAX_DISTANCE_M), so set it to the venue before creating them.
 */
import { createDb } from '@kapitwatt/db';
import {
  ApiErrorBody,
  HUB_TOWN,
  PILOT_BARANGAYS,
  RegisterResult,
  type MeterType,
} from '@kapitwatt/shared';

const API = process.env.API_URL ?? 'https://kapitwatt-api.dheyn-main.workers.dev';
const db = createDb(process.env.DATABASE_URL ?? '');
const PASSWORD = process.env.DEMO_PASSWORD ?? 'KapitWatt-Demo-2026';
/** Default: Santa Cruz town proper. */
const LAT = Number(process.env.DEMO_LAT ?? 14.2814);
const LNG = Number(process.env.DEMO_LNG ?? 121.4161);
const SERIAL_PREFIX = 'DEMO-';
const EMAIL_DOMAIN = 'kapitwatt.test';

interface DemoAccount {
  name: string;
  street: string;
  /** Index into the hub town's three sampled barangays. */
  barangay: 0 | 1 | 2;
  meterType: MeterType;
  billAvgKwhMonth: number;
  /** null: the household still has to do the practice run. */
  baselineKw: number | null;
}

const ACCOUNTS: DemoAccount[] = [
  {
    name: 'Maria Santos',
    street: '12 Rizal Street',
    barangay: 0,
    meterType: 'standard',
    billAvgKwhMonth: 450,
    baselineKw: 1.9,
  },
  {
    name: 'Jose Reyes',
    street: '45 Mabini Street',
    barangay: 0,
    meterType: 'standard',
    billAvgKwhMonth: 520,
    baselineKw: 2.1,
  },
  {
    name: 'Ana Dela Cruz',
    street: '8 Bonifacio Street',
    barangay: 0,
    meterType: 'standard',
    billAvgKwhMonth: 380,
    baselineKw: 1.6,
  },
  {
    name: 'Ramon Garcia',
    street: '27 Luna Street',
    barangay: 1,
    meterType: 'standard',
    billAvgKwhMonth: 610,
    baselineKw: 2.4,
  },
  {
    name: 'Liza Mendoza',
    street: '3 Del Pilar Street',
    barangay: 1,
    meterType: 'standard',
    billAvgKwhMonth: 300,
    baselineKw: 1.3,
  },
  {
    name: 'Carlo Bautista',
    street: '61 Burgos Street',
    barangay: 1,
    meterType: 'standard',
    billAvgKwhMonth: 480,
    baselineKw: 1.8,
  },
  {
    name: 'Grace Villanueva',
    street: '19 Quezon Avenue',
    barangay: 2,
    meterType: 'standard',
    billAvgKwhMonth: 420,
    baselineKw: 1.7,
  },
  {
    name: 'Mark Aquino',
    street: '5 Osmena Street',
    barangay: 2,
    meterType: 'ami',
    billAvgKwhMonth: 560,
    baselineKw: 2.2,
  },
  {
    name: 'Jenny Ramos',
    street: '33 Roxas Street',
    barangay: 2,
    meterType: 'ami',
    billAvgKwhMonth: 640,
    baselineKw: 2.6,
  },
  {
    name: 'Paolo Castillo',
    street: '14 Aguinaldo Street',
    barangay: 0,
    meterType: 'standard',
    billAvgKwhMonth: 450,
    baselineKw: null,
  },
];

const number = (i: number) => String(i + 1).padStart(2, '0');
const emailOf = (i: number) => `demo${number(i)}@${EMAIL_DOMAIN}`;
/** Ten digits starting 90000000: plainly a placeholder. */
const accountNumberOf = (i: number) => `90000000${number(i)}`;
const serialOf = (i: number) => `${SERIAL_PREFIX}${String(i + 1).padStart(4, '0')}`;

async function post(path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, json: text ? (JSON.parse(text) as unknown) : null };
}

async function remove() {
  const gone = await db`
    delete from households
    where email like ${`demo%@${EMAIL_DOMAIN}`} and meter_serial like ${`${SERIAL_PREFIX}%`}
      and not is_simulated
    returning email`;
  console.log(`removed ${gone.length} demo household(s)`);
}

async function create() {
  if (!Number.isFinite(LAT) || !Number.isFinite(LNG))
    throw new Error('DEMO_LAT / DEMO_LNG invalid');
  const { barangays } = (await (await fetch(`${API}/barangays`)).json()) as {
    barangays: { id: string; name: string; municipality: string }[];
  };
  const hub = PILOT_BARANGAYS[HUB_TOWN].map((name) => {
    const found = barangays.find((b) => b.municipality === HUB_TOWN && b.name === name);
    if (!found) throw new Error(`barangay ${name}, ${HUB_TOWN} is not seeded (pnpm db:seed)`);
    return found;
  });

  console.log(`demo accounts on ${API}`);
  console.log(`location ${LAT}, ${LNG}; password: ${PASSWORD}\n`);
  for (const [i, a] of ACCOUNTS.entries()) {
    const email = emailOf(i);
    const barangay = hub[a.barangay]!;
    const signup = {
      email,
      password: PASSWORD,
      accountNumber: accountNumberOf(i),
      accountName: a.name,
      serviceAddress: `${a.street}, ${barangay.name}`,
      barangayId: barangay.id,
      meterType: a.meterType,
      meterSerial: serialOf(i),
      billAvgKwhMonth: a.billAvgKwhMonth,
      lat: LAT,
      lng: LNG,
      consent: true,
      alertsConsent: true,
    };
    let res = await post('/auth/register', signup);
    if (res.status === 429) {
      // Sign-up is rate-limited per IP; ten in a row can reach the limit.
      console.log('  rate limited, waiting a minute...');
      await new Promise((r) => setTimeout(r, 61_000));
      res = await post('/auth/register', signup);
    }

    let state: string;
    if (res.status === 201) {
      const { household } = RegisterResult.parse(res.json);
      if (a.baselineKw !== null) {
        // Stands in for the practice run (photo) or the interval history (smart meter).
        await db`update households set baseline_kw = ${a.baselineKw} where id = ${household.id}`;
      }
      state = 'created';
    } else if (res.status === 409) {
      const code = ApiErrorBody.parse(res.json).error.code;
      if (code !== 'email_taken') throw new Error(`${email}: ${code}`);
      state = 'already there';
    } else {
      throw new Error(`${email}: HTTP ${res.status} ${JSON.stringify(res.json)}`);
    }
    const ready = a.baselineKw === null ? 'needs practice run' : `baseline ${a.baselineKw} kW`;
    const meter = a.meterType === 'ami' ? 'smart meter' : 'photo';
    console.log(
      `  ${email}  ${a.name.padEnd(17)} ${barangay.name.padEnd(14)} ${meter.padEnd(11)} ${ready}  (${state})`,
    );
  }
  console.log('\nOne phone per account: logging in on a second phone signs the first one out.');
}

if (process.argv.includes('--remove')) await remove();
else await create();
