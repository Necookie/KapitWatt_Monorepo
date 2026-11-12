import {
  actualKwFromReadings,
  barangayTargetHit,
  capKw,
  checkReadingValue,
  computeReward,
  DEFAULT_WINDOW_HOURS,
  isPhotoOnTime,
  PHOTO_RULES,
  photoBaselineKw,
  PILOT_BARANGAYS,
  PILOT_TOWNS,
  roundKw,
  SETTLEMENT_DELAY_MIN,
  verifyCut,
  type AlertTotals,
  type MockAlertView,
  type Barangay,
  type Commitment,
  type HouseholdMe,
  type CreateCommitmentInput,
  type MockHistoryItem,
  type LeaderboardEntry,
  type MeterReading,
  type MeterType,
  type MyEventStatus,
  type ReadingFlag,
  type RegisterHouseholdInput,
  type RegisterResult,
  type MockResultCard,
  type SubmitReadingInput,
  type SubmitReadingResponse,
} from '@kapitwatt/shared';
import { ApiError } from '../api';

/**
 * In-memory stand-in for the API while Person 3's endpoints return 501. Demo only; state resets
 * when the app reloads. It runs the real rule checks and payout math from @kapitwatt/shared.
 *
 * To reproduce the plan's worked example: rehearsal readings 1200.0 then 1203.8 (baseline 1.9 kW),
 * commit 1 kW, before photo 1204.3, after photo 1206.6 -> 1.6 kWh, PHP 8.06 + PHP 1.61, 160 points.
 */

/** true skips sign-up and the rehearsal with a ready-made Santa Cruz household. */
const MOCK_START_REGISTERED = false;
/** Meter type of the ready-made household (only used when MOCK_START_REGISTERED is true). */
const MOCK_DEMO_METER_TYPE = 'standard' as MeterType;

const MIN = 60_000;
const HOUR = 60 * MIN;
const WINDOW_MS = DEFAULT_WINDOW_HOURS * HOUR;
/** The rehearsal window length is not decided yet (SRS 8); the mock assumes a normal window. */
const REHEARSAL_HOURS = DEFAULT_WINDOW_HOURS;

const fakeId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const iso = (ms: number) => new Date(ms).toISOString();

const barangays: Barangay[] = PILOT_TOWNS.flatMap((town, t) =>
  PILOT_BARANGAYS[town].map((name, b) => ({
    id: fakeId(100 + t * 3 + b),
    name,
    municipality: town,
    feederId: null,
  })),
);

// ---------------------------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------------------------

interface MockHousehold {
  id: string;
  barangayId: string;
  meterType: MeterType;
  meterSerial: string;
  billAvgKwhMonth: number;
  lat: number;
  lng: number;
  baselineKw: number | null;
  /** Readings outside any event (the rehearsal). */
  rehearsal: MeterReading[];
}

/** A reading is stored with its offset from the window start, so fast-forward moves it along. */
interface EventReading {
  reading: MeterReading;
  offsetMs: number;
}

interface MockEvent {
  seq: number;
  createdAt: number;
  windowStart: number;
  windowEnd: number;
  settled: boolean;
  commitment: Commitment | null;
  readings: EventReading[];
  result: MockResultCard | null;
}

let household: MockHousehold | null = MOCK_START_REGISTERED ? demoHousehold() : null;
let event: MockEvent = newEvent(1);
let history: MockHistoryItem[] = seedHistory();
let readingSeq = 0;

function demoHousehold(): MockHousehold {
  return {
    id: fakeId(1),
    barangayId: barangays[0]!.id,
    meterType: MOCK_DEMO_METER_TYPE,
    meterSerial: 'MOCK-123456',
    billAvgKwhMonth: 720,
    lat: 14.2788,
    lng: 121.4161,
    baselineKw: 1.9,
    rehearsal: [],
  };
}

function newEvent(seq: number): MockEvent {
  const now = Date.now();
  const windowStart = now + 5 * MIN;
  return {
    seq,
    createdAt: now,
    windowStart,
    windowEnd: windowStart + WINDOW_MS,
    settled: false,
    commitment: null,
    readings: [],
    result: null,
  };
}

function seedHistory(): MockHistoryItem[] {
  const day = 24 * HOUR;
  const past = (daysAgo: number, seq: number, credit: number, bonus: number, kwh: number) => {
    const start = Date.now() - daysAgo * day;
    return {
      alert: {
        id: fakeId(8000 + seq),
        level: 'yellow' as const,
        windowStart: iso(start),
        windowEnd: iso(start + WINDOW_MS),
      },
      committedKw: 1,
      result: {
        alertId: fakeId(8000 + seq),
        committedKw: 1,
        cutKw: kwh / DEFAULT_WINDOW_HOURS,
        paidCutKw: kwh / DEFAULT_WINDOW_HOURS,
        verifiedKwh: kwh,
        creditPhp: credit,
        bonusPhp: bonus,
        points: Math.round(kwh * 100),
        barangayTargetHit: bonus > 0,
        zeroReason: kwh > 0 ? null : ('late_photo' as const),
      },
    };
  };
  return [past(3, 2, 6.05, 0, 1.2), past(9, 1, 0, 0, 0)];
}

const alertId = () => fakeId(9000 + event.seq);

function requireHousehold(): MockHousehold {
  if (!household) throw new ApiError(401, { error: 'unauthorized' });
  return household;
}

function assertAlert(id: string) {
  if (id !== alertId()) throw new ApiError(404, { error: 'not_found' });
}

const pathOf = (h: MockHousehold) => (h.meterType === 'ami' ? 'ami' : 'photo');

function eventReadings(): MeterReading[] {
  return event.readings.map((r) => ({
    ...r.reading,
    capturedAt: iso(event.windowStart + r.offsetMs),
  }));
}

/** null until the household has a baseline, like the API. */
function commitCapKw(h: MockHousehold): number | null {
  if (h.baselineKw === null) return null;
  return roundKw(Math.min(h.baselineKw, capKw(h.billAvgKwhMonth)));
}

function totalCreditPhp(): number {
  const sum = history.reduce((s, item) => s + (item.result?.creditPhp ?? 0), 0);
  return Math.round(sum * 100) / 100;
}

function totalPoints(): number {
  return history.reduce((s, item) => s + (item.result?.points ?? 0), 0);
}

// ---------------------------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------------------------

export async function getBarangays(): Promise<Barangay[]> {
  await delay();
  return barangays;
}

export async function register(input: RegisterHouseholdInput): Promise<RegisterResult> {
  await delay(500);
  if (!barangays.some((b) => b.id === input.barangayId)) {
    throw new ApiError(422, { error: 'unknown_barangay' });
  }
  household = {
    id: fakeId(1),
    barangayId: input.barangayId,
    meterType: input.meterType,
    meterSerial: input.meterSerial,
    billAvgKwhMonth: input.billAvgKwhMonth,
    lat: input.lat,
    lng: input.lng,
    // Smart meters have interval history, so the baseline is known right away.
    baselineKw: input.meterType === 'ami' ? 1.9 : null,
    rehearsal: [],
  };
  return { token: 'mock-token', household: meOf(household) };
}

export async function getMe(): Promise<HouseholdMe> {
  await delay();
  return meOf(requireHousehold());
}

/** The same shape as GET /auth/me (HouseholdMe in @kapitwatt/shared). */
function meOf(h: MockHousehold): HouseholdMe {
  const b = barangays.find((x) => x.id === h.barangayId)!;
  return {
    id: h.id,
    barangayId: b.id,
    barangayName: b.name,
    municipality: b.municipality,
    meterType: h.meterType,
    path: pathOf(h),
    meterSerial: h.meterSerial,
    billAvgKwhMonth: h.billAvgKwhMonth,
    baselineKw: h.baselineKw,
    needsRehearsal: h.meterType === 'standard' && h.baselineKw === null,
    rehearsalReadings: h.rehearsal.length,
    trustScore: 0.5,
    commitCapKw: commitCapKw(h),
    optedIn: true,
    points: totalPoints(),
    creditPhp: totalCreditPhp(),
  };
}

function alertView(): MockAlertView {
  const now = Date.now();
  const status = event.settled
    ? 'settled'
    : now < event.windowStart
      ? 'active'
      : now < event.windowEnd
        ? 'window_open'
        : 'settling';
  return {
    alert: {
      id: alertId(),
      level: 'red',
      windowStart: iso(event.windowStart),
      windowEnd: iso(event.windowEnd),
      targetKw: 600,
      targetBarangayIds: barangays.map((b) => b.id),
      message: 'Red alert on the Luzon grid (simulated). Please cut load during the peak window.',
      status,
      createdBy: 'operator (mock)',
      createdAt: iso(event.createdAt),
      clockOffsetSec: 0,
      settledAt: null,
      cancelledAt: null,
      pushSentAt: null,
    },
    beforePhotoDueAt: iso(event.windowStart + PHOTO_RULES.beforeDeadlineMin * MIN),
    afterPhotoOpensAt: iso(event.windowEnd),
    afterPhotoDueAt: iso(event.windowEnd + PHOTO_RULES.afterDeadlineMin * MIN),
    settlesAt: iso(event.windowEnd + SETTLEMENT_DELAY_MIN * MIN),
    serverTime: iso(now),
  };
}

export async function getActiveAlert(): Promise<MockAlertView | null> {
  await delay();
  requireHousehold();
  return alertView();
}

export async function getAlert(id: string): Promise<MockAlertView> {
  await delay();
  assertAlert(id);
  return alertView();
}

export async function getAlertTotals(id: string): Promise<AlertTotals> {
  await delay(100);
  assertAlert(id);
  const now = Date.now();
  const share = 600 / barangays.length;
  const mine = household?.barangayId;
  // Commits arrive over ~25 s after the alert goes out, like the simulator's paced run.
  const ramp = Math.min(1, (now - event.createdAt) / 25_000);
  const windowOpen = now >= event.windowStart && !event.settled;
  const rows = barangays.map((b) => {
    const isMine = b.id === mine;
    const committedKw = roundKw(
      ramp * (isMine ? 36 : 34) + (isMine ? (event.commitment?.committedKw ?? 0) : 0),
    );
    // Live delivery comes from AMI households only; photo cuts land at settlement.
    const deliveredKw = event.settled ? (isMine ? 30.2 : 25.1) : windowOpen ? 4.1 : 0;
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
  const h = requireHousehold();
  const now = Date.now();
  const windowOpen = now >= event.windowStart && now < event.windowEnd && !event.settled;
  const live =
    h.meterType === 'ami' && windowOpen && event.commitment
      ? roundKw(0.8 + (Math.random() - 0.5) * 0.2)
      : null;
  return {
    commitment: event.commitment,
    readings: eventReadings(),
    liveReductionKw: live,
    serverTime: iso(now),
  };
}

export async function createCommitment(input: CreateCommitmentInput): Promise<Commitment> {
  await delay();
  assertAlert(input.alertId);
  const h = requireHousehold();
  if (h.baselineKw === null) throw new ApiError(409, { error: 'needs_rehearsal' });
  if (event.commitment) throw new ApiError(409, { error: 'already_committed' });
  if (Date.now() >= event.windowEnd) throw new ApiError(409, { error: 'window_closed' });
  if (input.committedKw > (commitCapKw(h) ?? 0)) throw new ApiError(422, { error: 'above_cap' });
  event.commitment = {
    id: fakeId(5000 + event.seq),
    alertId: input.alertId,
    householdId: h.id,
    committedKw: input.committedKw,
    path: pathOf(h),
    baselineKw: h.baselineKw,
    actualKw: null,
    verifiedKwh: null,
    status: 'committed',
    resultReason: null,
  };
  return event.commitment;
}

/** Runs the plain photo rules from @kapitwatt/shared. Serial match and duplicate hash need the
 * real photo and stay on the server. */
export async function submitReading(
  input: SubmitReadingInput,
  _photoUri: string,
): Promise<SubmitReadingResponse> {
  await delay(800);
  const h = requireHousehold();
  const now = Date.now();
  const flags: ReadingFlag[] = [];

  const previous = [...h.rehearsal, ...eventReadings()].at(-1);
  if (previous) {
    const hours =
      input.kind === 'rehearsal'
        ? REHEARSAL_HOURS
        : Math.max(0.01, (now - new Date(previous.capturedAt).getTime()) / HOUR);
    flags.push(
      ...checkReadingValue(input.readingKwh, previous.readingKwh, hours, h.billAvgKwhMonth),
    );
  }
  // GPS distance is checked by the API only: its threshold is an open item (SRS 8).

  const base = {
    id: fakeId(7000 + readingSeq++),
    householdId: h.id,
    kind: input.kind,
    readingKwh: input.readingKwh,
    receivedAt: iso(Date.now()),
    photoKey: null,
    lat: input.lat,
    lng: input.lng,
    reviewedBy: null,
    reviewedAt: null,
    checkStatus: flags.length ? ('flagged' as const) : ('pass' as const),
    flags,
  };

  if (input.kind === 'rehearsal') {
    if (h.rehearsal.length >= 2) throw new ApiError(409, { error: 'already_submitted' });
    // Mock: date the rehearsal a day back, as at sign-up, so the first event's before photo is
    // not judged against a reading taken seconds earlier.
    const reading: MeterReading = { ...base, commitmentId: null, capturedAt: iso(now - 24 * HOUR) };
    h.rehearsal.push(reading);
    const [first, second] = h.rehearsal;
    if (first && second && second.checkStatus === 'pass') {
      h.baselineKw = photoBaselineKw(
        first.readingKwh,
        second.readingKwh,
        REHEARSAL_HOURS,
        h.billAvgKwhMonth,
      );
    }
    return reading;
  }

  if (!input.alertId) throw new ApiError(422, { error: 'alert_required' });
  assertAlert(input.alertId);
  if (!event.commitment) throw new ApiError(409, { error: 'no_commitment' });
  if (event.readings.some((r) => r.reading.kind === input.kind)) {
    throw new ApiError(409, { error: 'already_submitted' });
  }
  if (
    !isPhotoOnTime(
      input.kind,
      new Date(now),
      new Date(event.windowStart),
      new Date(event.windowEnd),
    )
  ) {
    throw new ApiError(409, { error: 'deadline_passed' });
  }
  const reading: MeterReading = {
    ...base,
    commitmentId: event.commitment.id,
    capturedAt: iso(now),
  };
  event.readings.push({ reading, offsetMs: now - event.windowStart });
  return reading;
}

export async function getResult(id: string): Promise<MockResultCard | null> {
  await delay();
  assertAlert(id);
  return event.result;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  await delay();
  const mine = household?.barangayId;
  const rows = barangays.map((b, i) => {
    // Stable fake totals; the household's own barangay also gets its real points.
    const verifiedKwh = roundKw(40 + ((i * 37) % 60) + (b.id === mine ? totalPoints() / 100 : 0));
    return {
      barangayId: b.id,
      name: b.name,
      municipality: b.municipality,
      verifiedKwh,
      points: Math.round(verifiedKwh * 100),
    };
  });
  return rows.sort((a, b) => b.points - a.points).map((r, i) => ({ ...r, rank: i + 1 }));
}

export async function getHistory(): Promise<MockHistoryItem[]> {
  await delay();
  requireHousehold();
  return history;
}

// ---------------------------------------------------------------------------------------------
// Settlement and mock controls
// ---------------------------------------------------------------------------------------------

function settle() {
  event.settled = true;
  const c = event.commitment;
  const h = household;
  if (!c || !h || h.baselineKw === null) return;
  const readings = eventReadings();
  const before = readings.find((r) => r.kind === 'before');
  const after = readings.find((r) => r.kind === 'after');
  const targetHit = true; // The demo seed has the presenter's barangay hit its target.
  const base = { alertId: c.alertId, committedKw: c.committedKw, barangayTargetHit: targetHit };
  const zero = { cutKw: 0, paidCutKw: 0, verifiedKwh: 0, creditPhp: 0, bonusPhp: 0, points: 0 };

  if (c.path === 'photo' && (!before || !after)) {
    event.result = { ...base, ...zero, zeroReason: 'missing_photo' };
  } else if (
    c.path === 'photo' &&
    (before?.checkStatus !== 'pass' || after?.checkStatus !== 'pass')
  ) {
    // In the real flow a person reviews flagged readings first; the mock treats them as rejected.
    event.result = { ...base, ...zero, zeroReason: 'failed_check' };
  } else {
    const actualKw =
      before && after
        ? actualKwFromReadings(
            before.readingKwh,
            after.readingKwh,
            (new Date(after.capturedAt).getTime() - new Date(before.capturedAt).getTime()) / HOUR,
          )
        : roundKw(h.baselineKw - 0.8); // AMI: the feed shows a 0.8 kW drop.
    const cut = verifyCut({
      baselineKw: h.baselineKw,
      actualKw,
      committedKw: c.committedKw,
      billAvgKwhMonth: h.billAvgKwhMonth,
      windowHours: DEFAULT_WINDOW_HOURS,
    });
    const reward = computeReward(cut.verifiedKwh, c.path, targetHit);
    event.result = {
      ...base,
      ...cut,
      ...reward,
      zeroReason: cut.verifiedKwh > 0 ? null : 'no_measured_cut',
    };
    c.actualKw = actualKw;
    c.verifiedKwh = cut.verifiedKwh;
  }
  c.status = event.result.verifiedKwh > 0 ? 'verified' : 'unverified';
  history = [
    {
      alert: {
        id: c.alertId,
        level: 'red',
        windowStart: iso(event.windowStart),
        windowEnd: iso(event.windowEnd),
      },
      committedKw: c.committedKw,
      result: event.result,
    },
    ...history,
  ];
}

/**
 * Mock-only stand-in for the operator's "Measure (fast-forward)": jump to the next phase.
 * before window -> window open -> settling -> settled -> a fresh alert. The jumps land 4 min
 * after window start and 10 min after window end, the times in the plan's worked example.
 */
export function mockFastForward() {
  const now = Date.now();
  if (event.settled) {
    event = newEvent(event.seq + 1);
  } else if (now < event.windowStart) {
    event.windowStart = now - 4 * MIN;
    event.windowEnd = event.windowStart + WINDOW_MS;
  } else if (now < event.windowEnd) {
    event.windowEnd = now - 10 * MIN;
    event.windowStart = event.windowEnd - WINDOW_MS;
  } else {
    settle();
  }
}

/** Mock-only: which phase the mock event is in, so the demo controls can label the next step. */
export function mockPhase(): 'before_window' | 'window_open' | 'settling' | 'settled' {
  const now = Date.now();
  if (event.settled) return 'settled';
  if (now < event.windowStart) return 'before_window';
  if (now < event.windowEnd) return 'window_open';
  return 'settling';
}

/** Mock-only stand-in for the operator sending a new alert from the dashboard. */
export function mockSendAlert() {
  event = newEvent(event.seq + 1);
}

/** Mock-only: forget the household and all events, back to sign-up. */
export function mockResetAll() {
  household = MOCK_START_REGISTERED ? demoHousehold() : null;
  event = newEvent(event.seq + 1);
  history = seedHistory();
}
