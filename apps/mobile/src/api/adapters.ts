import {
  PHOTO_RULES,
  SETTLEMENT_DELAY_MIN,
  type AlertView,
  type Commitment,
  type CommitmentView,
  type HistoryItem,
  type LeaderboardEntry,
  type LeaderboardRow,
  type MeterReading,
  type MockAlertView,
  type MockHistoryItem,
  type MockResultCard,
  type MyEventStatus,
  type ReadingSummary,
  type ResultCard,
  type SubmitReadingInput,
  type SubmitReadingResult,
} from '@kapitwatt/shared';

/**
 * Converts the API's real responses (packages/shared/src/schemas/responses.ts) into the shapes the
 * screens were built on (mobile-mock.ts), so the screens do not change while the app goes live.
 * Pure functions, no I/O. Fields the API does not send and no screen reads are filled with the
 * neutral values below; do not start reading them without adding them to the API first.
 */

const MIN_MS = 60_000;
const plusMin = (iso: string, minutes: number) =>
  new Date(Date.parse(iso) + minutes * MIN_MS).toISOString();

/** The API never sends another household's id, and not the caller's own either. */
const UNKNOWN_ID = '';

/**
 * GET /alerts/active and GET /alerts/:id. The photo deadlines follow the same fixed rules the API
 * applies (PHOTO_RULES), on the alert's own clock: `serverNow` already includes the demo
 * fast-forward, so the deadlines stay put and the clock jumps.
 */
export function toAlertView(a: AlertView): MockAlertView {
  return {
    alert: {
      id: a.id,
      level: a.level,
      windowStart: a.windowStart,
      windowEnd: a.windowEnd,
      targetKw: a.targetKw,
      targetBarangayIds: a.targetBarangayIds,
      message: a.message,
      status: a.status,
      createdBy: a.createdBy,
      createdAt: a.createdAt,
      pushSentAt: a.pushSentAt,
      sendAt: a.sendAt ?? null,
      // Not sent by the API and not read by any screen.
      clockOffsetSec: 0,
      settledAt: null,
      cancelledAt: null,
    },
    beforePhotoDueAt: plusMin(a.windowStart, PHOTO_RULES.beforeDeadlineMin),
    afterPhotoOpensAt: a.windowEnd,
    afterPhotoDueAt: plusMin(a.windowEnd, PHOTO_RULES.afterDeadlineMin),
    settlesAt: plusMin(a.windowEnd, SETTLEMENT_DELAY_MIN),
    serverTime: a.serverNow,
  };
}

export function toCommitment(c: CommitmentView): Commitment {
  return {
    id: c.id,
    alertId: c.alertId,
    householdId: UNKNOWN_ID,
    committedKw: c.committedKw,
    path: c.path,
    baselineKw: c.baselineKw,
    actualKw: c.actualKw,
    verifiedKwh: c.verifiedKwh,
    status: c.status,
    resultReason: c.resultReason,
  };
}

function toReading(r: ReadingSummary, commitmentId: string): MeterReading {
  return {
    id: r.id,
    householdId: UNKNOWN_ID,
    commitmentId,
    kind: r.kind,
    readingKwh: r.readingKwh,
    capturedAt: r.capturedAt,
    checkStatus: r.checkStatus,
    flags: r.flags,
    // Not sent to the household and not read by any screen.
    receivedAt: r.capturedAt,
    photoKey: null,
    lat: null,
    lng: null,
    reviewedBy: null,
    reviewedAt: null,
  };
}

/** GET /commitments/by-alert/:alertId. */
export function toEventStatus(c: CommitmentView): MyEventStatus {
  const readings = [c.readings.before, c.readings.after]
    .filter((r): r is ReadingSummary => r !== null)
    .map((r) => toReading(r, c.id));
  return {
    commitment: toCommitment(c),
    readings,
    liveReductionKw: c.liveReductionKw,
    serverTime: c.serverNow,
  };
}

/** The same call answers 404 not_committed before the household commits. */
export function notCommittedStatus(serverTime: string): MyEventStatus {
  return { commitment: null, readings: [], liveReductionKw: null, serverTime };
}

/** GET /rewards/by-alert/:alertId. */
export function toResultCard(r: ResultCard): MockResultCard {
  return {
    alertId: r.alertId,
    committedKw: r.committedKw,
    cutKw: r.cutKw ?? 0,
    paidCutKw: r.paidCutKw ?? 0,
    verifiedKwh: r.verifiedKwh,
    creditPhp: r.creditPhp,
    bonusPhp: r.bonusPhp,
    points: r.points,
    barangayTargetHit: r.barangay.targetHit,
    zeroReason: r.resultReason,
  };
}

/** GET /barangays/leaderboard: the API sends the rows in rank order. */
export function toLeaderboard(rows: LeaderboardRow[]): LeaderboardEntry[] {
  return rows.map((row, i) => ({
    rank: i + 1,
    barangayId: row.barangayId,
    name: row.name,
    municipality: row.municipality,
    points: row.points,
    verifiedKwh: row.verifiedKwh,
  }));
}

/** GET /commitments/history. A commitment still `committed` has not been settled yet. */
export function toHistoryItem(h: HistoryItem): MockHistoryItem {
  return {
    alert: { id: h.alertId, level: h.level, windowStart: h.windowStart, windowEnd: h.windowEnd },
    committedKw: h.committedKw,
    result:
      h.status === 'committed'
        ? null
        : {
            alertId: h.alertId,
            committedKw: h.committedKw,
            verifiedKwh: h.verifiedKwh ?? 0,
            creditPhp: h.creditPhp,
            bonusPhp: h.bonusPhp,
            points: h.points,
            // The bonus is only paid when the barangay reached its target.
            barangayTargetHit: h.bonusPhp > 0,
            // The history list does not carry these; the result card screen fetches the real ones.
            cutKw: 0,
            paidCutKw: 0,
            zeroReason: null,
          },
  };
}

/**
 * POST /readings answers with the check result only. The rest is what was just sent; `capturedAt`
 * is the app's server-corrected time and is for display only (the server stamps the real one).
 */
export function toSubmittedReading(
  r: SubmitReadingResult,
  input: SubmitReadingInput,
  capturedAt: string,
): MeterReading {
  return {
    id: r.id,
    householdId: UNKNOWN_ID,
    commitmentId: null,
    kind: r.kind,
    readingKwh: input.readingKwh,
    capturedAt,
    receivedAt: capturedAt,
    photoKey: null,
    lat: input.lat,
    lng: input.lng,
    checkStatus: r.checkStatus,
    flags: r.flags,
    reviewedBy: null,
    reviewedAt: null,
  };
}
