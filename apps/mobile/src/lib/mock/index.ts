import {
  actualKwFromReadings,
  barangayTargetHit,
  capKw,
  computeReward,
  DEFAULT_WINDOW_HOURS,
  PHOTO_RULES,
  PILOT_BARANGAYS,
  PILOT_TOWNS,
  roundKw,
  SETTLEMENT_DELAY_MIN,
  verifyCut,
  type AlertTotals,
  type AlertView,
  type Commitment,
  type CreateCommitmentInput,
  type MeResponse,
  type MeterReading,
  type MeterType,
  type MyEventStatus,
  type ResultCard,
} from '@kapitwatt/shared';
import { ApiError } from '../api';

/**
 * In-memory stand-in for the API while Person 3's endpoints return 501. Demo only.
 * It settles with the real payout math from @kapitwatt/shared, using the plan's worked example
 * (baseline 1.9 kW, readings 1204.3 -> 1206.6), so a 1 kW commit yields 1.6 kWh, PHP 8.06 + 1.61.
 */

/** Flip to 'ami' to see the smart-meter version of the event screen. */
const MOCK_METER_TYPE = 'standard' as MeterType;
/**
 * Until the capture screen exists, fill in the worked-example photos at settlement so the result
 * card has something to show. Set to false to see the "missing photo" zero-payout card.
 */
const MOCK_AUTOFILL_PHOTOS = true;

const MIN = 60_000;
const HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000001';
const BASELINE_KW = 1.9;
const BILL_AVG_KWH_MONTH = 720;
const READING_BEFORE = 1204.3;
const READING_AFTER = 1206.6;

const fakeId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const barangays = PILOT_TOWNS.flatMap((town, t) =>
  PILOT_BARANGAYS[town].map((name, b) => ({
    id: fakeId(100 + t * 3 + b),
    name,
    municipality: town,
  })),
);
/** The demo phone lives in Bagumbayan, Santa Cruz (the hub). */
const myBarangay = barangays[0]!;

const path = MOCK_METER_TYPE === 'ami' ? 'ami' : 'photo';
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const iso = (ms: number) => new Date(ms).toISOString();

interface MockState {
  alertSeq: number;
  createdAt: number;
  windowStart: number;
  windowEnd: number;
  settled: boolean;
  commitment: Commitment | null;
  readings: MeterReading[];
  result: ResultCard | null;
}

let state: MockState = newAlertState(1);

function newAlertState(seq: number): MockState {
  const now = Date.now();
  const windowStart = now + 5 * MIN;
  return {
    alertSeq: seq,
    createdAt: now,
    windowStart,
    windowEnd: windowStart + DEFAULT_WINDOW_HOURS * 60 * MIN,
    settled: false,
    commitment: null,
    readings: [],
    result: null,
  };
}

const alertId = () => fakeId(9000 + state.alertSeq);

function alertView(): AlertView {
  const now = Date.now();
  const status = state.settled
    ? 'settled'
    : now < state.windowStart
      ? 'active'
      : now < state.windowEnd
        ? 'window_open'
        : 'settling';
  return {
    alert: {
      id: alertId(),
      level: 'red',
      windowStart: iso(state.windowStart),
      windowEnd: iso(state.windowEnd),
      targetKw: 600,
      targetBarangayIds: barangays.map((b) => b.id),
      message: 'Red alert on the Luzon grid (simulated). Please cut load during the peak window.',
      status,
      createdBy: 'operator (mock)',
      createdAt: iso(state.createdAt),
    },
    beforePhotoDueAt: iso(state.windowStart + PHOTO_RULES.beforeDeadlineMin * MIN),
    afterPhotoOpensAt: iso(state.windowEnd),
    afterPhotoDueAt: iso(state.windowEnd + PHOTO_RULES.afterDeadlineMin * MIN),
    settlesAt: iso(state.windowEnd + SETTLEMENT_DELAY_MIN * MIN),
    serverTime: iso(now),
  };
}

function assertAlert(id: string) {
  if (id !== alertId()) throw new ApiError(404, { error: 'not_found' });
}

export async function getMe(): Promise<MeResponse> {
  await delay();
  return {
    householdId: HOUSEHOLD_ID,
    barangayId: myBarangay.id,
    barangayName: myBarangay.name,
    municipality: myBarangay.municipality,
    meterType: MOCK_METER_TYPE,
    baselineKw: BASELINE_KW,
    trustScore: 0.5,
    commitCapKw: roundKw(Math.min(BASELINE_KW, capKw(BILL_AVG_KWH_MONTH))),
    totalPoints: state.result?.points ?? 0,
    serverTime: iso(Date.now()),
  };
}

export async function getActiveAlert(): Promise<AlertView | null> {
  await delay();
  return alertView();
}

export async function getAlert(id: string): Promise<AlertView> {
  await delay();
  assertAlert(id);
  return alertView();
}

export async function getAlertTotals(id: string): Promise<AlertTotals> {
  await delay(100);
  assertAlert(id);
  const now = Date.now();
  const share = 600 / barangays.length;
  // Commits arrive over ~25 s after the alert goes out, like the simulator's paced run.
  const ramp = Math.min(1, (now - state.createdAt) / 25_000);
  const windowOpen = now >= state.windowStart && !state.settled;
  const rows = barangays.map((b) => {
    const isMine = b.id === myBarangay.id;
    const committedKw = roundKw(
      ramp * (isMine ? 36 : 34) + (isMine ? (state.commitment?.committedKw ?? 0) : 0),
    );
    // Live delivery comes from AMI households only; photo cuts land at settlement.
    const deliveredKw = state.settled ? (isMine ? 30.2 : 25.1) : windowOpen ? 4.1 : 0;
    return {
      barangayId: b.id,
      name: b.name,
      municipality: b.municipality,
      targetKw: roundKw(share),
      committedKw,
      deliveredKw,
      targetHit: barangayTargetHit(deliveredKw, share),
    };
  });
  return {
    alertId: id,
    targetKw: 600,
    committedKw: roundKw(rows.reduce((s, r) => s + r.committedKw, 0)),
    deliveredKw: roundKw(rows.reduce((s, r) => s + r.deliveredKw, 0)),
    barangays: rows,
  };
}

export async function getMyEventStatus(id: string): Promise<MyEventStatus> {
  await delay(100);
  assertAlert(id);
  const now = Date.now();
  const windowOpen = now >= state.windowStart && now < state.windowEnd && !state.settled;
  const live =
    path === 'ami' && windowOpen && state.commitment
      ? roundKw(0.8 + (Math.random() - 0.5) * 0.2)
      : null;
  return {
    commitment: state.commitment,
    readings: state.readings,
    liveReductionKw: live,
    serverTime: iso(now),
  };
}

export async function createCommitment(input: CreateCommitmentInput): Promise<Commitment> {
  await delay();
  assertAlert(input.alertId);
  const me = await getMe();
  if (state.commitment) throw new ApiError(409, { error: 'already_committed' });
  if (Date.now() >= state.windowEnd) throw new ApiError(409, { error: 'window_closed' });
  if (input.committedKw > me.commitCapKw) throw new ApiError(422, { error: 'above_cap' });
  state.commitment = {
    id: fakeId(5000 + state.alertSeq),
    alertId: input.alertId,
    householdId: HOUSEHOLD_ID,
    committedKw: input.committedKw,
    path,
    baselineKw: BASELINE_KW,
    actualKw: null,
    verifiedKwh: null,
    status: 'committed',
  };
  return state.commitment;
}

export async function getResult(id: string): Promise<ResultCard | null> {
  await delay();
  assertAlert(id);
  return state.result;
}

function reading(kind: 'before' | 'after', kwh: number, at: number): MeterReading {
  return {
    id: fakeId(7000 + state.readings.length),
    householdId: HOUSEHOLD_ID,
    commitmentId: state.commitment?.id ?? null,
    kind,
    readingKwh: kwh,
    capturedAt: iso(at),
    photoUrl: null,
    checkStatus: 'pass',
    flags: [],
  };
}

function settle() {
  state.settled = true;
  const c = state.commitment;
  if (!c) return;
  if (c.path === 'photo' && MOCK_AUTOFILL_PHOTOS && state.readings.length === 0) {
    state.readings.push(reading('before', READING_BEFORE, state.windowStart + 4 * MIN));
    state.readings.push(reading('after', READING_AFTER, state.windowEnd + 10 * MIN));
  }
  const before = state.readings.find((r) => r.kind === 'before');
  const after = state.readings.find((r) => r.kind === 'after');
  const targetHit = true; // The demo seed has the presenter's barangay hit its target.
  const base = { alertId: c.alertId, committedKw: c.committedKw, barangayTargetHit: targetHit };

  if (c.path === 'photo' && (!before || !after)) {
    state.result = {
      ...base,
      cutKw: 0,
      paidCutKw: 0,
      verifiedKwh: 0,
      creditPhp: 0,
      bonusPhp: 0,
      points: 0,
      zeroReason: 'missing_photo',
    };
    c.status = 'unverified';
    return;
  }
  const actualKw =
    before && after
      ? actualKwFromReadings(
          before.readingKwh,
          after.readingKwh,
          (new Date(after.capturedAt).getTime() - new Date(before.capturedAt).getTime()) /
            (60 * MIN),
        )
      : roundKw(BASELINE_KW - 0.8); // AMI: the feed shows a 0.8 kW drop.
  const cut = verifyCut({
    baselineKw: BASELINE_KW,
    actualKw,
    committedKw: c.committedKw,
    billAvgKwhMonth: BILL_AVG_KWH_MONTH,
    windowHours: DEFAULT_WINDOW_HOURS,
  });
  const reward = computeReward(cut.verifiedKwh, c.path, targetHit);
  state.result = {
    ...base,
    ...cut,
    ...reward,
    zeroReason: cut.verifiedKwh > 0 ? null : 'no_measured_cut',
  };
  c.actualKw = actualKw;
  c.verifiedKwh = cut.verifiedKwh;
  c.status = cut.verifiedKwh > 0 ? 'verified' : 'unverified';
}

/**
 * Mock-only stand-in for the operator's "Measure (fast-forward)": jump to the next phase.
 * before window -> window open -> settling -> settled -> a fresh alert.
 */
export function mockFastForward() {
  const now = Date.now();
  const windowMs = DEFAULT_WINDOW_HOURS * 60 * MIN;
  if (state.settled) {
    state = newAlertState(state.alertSeq + 1);
  } else if (now < state.windowStart) {
    state.windowStart = now - MIN;
    state.windowEnd = state.windowStart + windowMs;
  } else if (now < state.windowEnd) {
    state.windowEnd = now - MIN;
    state.windowStart = state.windowEnd - windowMs;
  } else {
    settle();
  }
}
