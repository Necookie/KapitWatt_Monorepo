import {
  ActiveAlertResponse,
  AlertLogResponse,
  AlertView,
  ApiErrorBody,
  FlaggedReading,
  AlertAnalytics,
  AlertHistoryResponse,
  type AlertHistoryItem,
} from '@kapitwatt/shared';
import type {
  AlertTotals,
  BarangayWithCount,
  CreateAlertInput,
  FastForwardInput,
  ReviewReadingInput,
  SimParams,
  SimRunSummary,
  SimStatus,
  UpdateTargetsInput,
} from '@kapitwatt/shared';
import { MemoryBackend, MemoryBackendError } from '@kapitwatt/sim';
import { ApiError, api, apiBlob } from './http';

/**
 * Everything the dashboard asks of the backend, behind one interface with two
 * implementations: the live API, and a fixture that runs the real simulator against
 * an in-memory backend in the browser. Set EXPO_PUBLIC_FIXTURES=1 for the fixture.
 */
/** What the dashboard reads of an alert: the API's AlertView without its clock. The fixture's Alert fits too. */
export type DashboardAlert = Omit<AlertView, 'serverNow'>;

/**
 * Drops the server clock from a polled alert. It changes on every response, so keeping it would make
 * every poll look like new data and re-render the whole page every 2 seconds.
 */
function withoutClock<T extends { serverNow?: unknown }>(alert: T): Omit<T, 'serverNow'> {
  const { serverNow: _clock, ...rest } = alert;
  return rest;
}

export interface DashboardClient {
  listBarangays(): Promise<BarangayWithCount[]>;
  /** The alert the operator is working on, settled ones included. Null when there is none. */
  getCurrentAlert(): Promise<DashboardAlert | null>;
  createAlert(input: CreateAlertInput): Promise<DashboardAlert>;
  /** End an alert early; the API sends the alert-lifted push (FR-DASH-12). */
  cancelAlert(alertId: string): Promise<void>;
  /** The alert log, newest first (FR-DASH-13). */
  listAlerts(): Promise<DashboardAlert[]>;
  getTotals(alertId: string): Promise<AlertTotals>;
  /** Operator override of barangay shares of the target, while the alert is open. */
  updateTargets(alertId: string, targets: UpdateTargetsInput['targets']): Promise<void>;
  fastForward(alertId: string, to: FastForwardInput['to']): Promise<void>;
  settle(alertId: string): Promise<void>;
  /** Readings that failed a rule check and wait for a person (FR-DASH-11). */
  listFlagged(): Promise<FlaggedReading[]>;
  reviewReading(readingId: string, decision: ReviewReadingInput['decision']): Promise<void>;
  /**
   * The photo of a reading, from the private bucket. There is no public link: the bytes
   * are fetched with the operator key and shown from a blob URL the caller must revoke.
   */
  readingPhoto(readingId: string): Promise<string>;
  simStatus(): Promise<SimStatus>;
  simSeed(params: Pick<SimParams, 'amiShare' | 'seed'>): Promise<void>;
  simRun(alertId: string, params: SimParams, phase: 'commit' | 'deliver'): Promise<SimRunSummary>;
  simReset(): Promise<void>;
  /** Operator analytics for one alert: funnel, outcomes, payouts, commit timeline. Live API only. */
  getAnalytics(alertId: string): Promise<AlertAnalytics>;
  /** Recent alerts with committed, delivered and paid totals. Live API only. */
  getAlertHistory(): Promise<AlertHistoryItem[]>;
}

export const USE_FIXTURES = process.env.EXPO_PUBLIC_FIXTURES === '1';
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

// --- live API ----------------------------------------------------------------

/**
 * How long a finished event's results stay on Live load once nothing is open. By when the alert was
 * sent: the replayed past events (`pnpm demo:reset`) are days old, so after a reset the page is calm.
 */
const RECENT_RESULTS_MS = 12 * 3_600_000;

/**
 * The newest event in the log, asked at most this often while nothing is open: the log counts
 * against the operator rate limit, which every open dashboard shares, and the page polls every ~2 s.
 */
const LATEST_EVENT_TTL_MS = 30_000;
let latestEvent: { at: number; alert: AlertView | undefined } | null = null;
/** An open alert was on screen at the last poll: when it settles, its results are asked for at once. */
let sawOpenAlert = false;

async function newestEvent(): Promise<AlertView | undefined> {
  if (!latestEvent || sawOpenAlert || Date.now() - latestEvent.at > LATEST_EVENT_TTL_MS) {
    const [alert] = AlertLogResponse.parse(await api('/alerts?limit=1')).alerts;
    latestEvent = { at: Date.now(), alert };
    sawOpenAlert = false;
  }
  return latestEvent.alert;
}

/** The finished event this browser chose to stop showing (the simulator's reset). Never an open one. */
const DISMISSED_KEY = 'kapitwatt.dashboard.dismissedAlertId';

function dismissedAlertId(): string | null {
  try {
    return globalThis.localStorage?.getItem(DISMISSED_KEY) ?? null;
  } catch {
    return null;
  }
}

function dismissAlert(id: string): void {
  try {
    globalThis.localStorage?.setItem(DISMISSED_KEY, id);
  } catch {
    // Private window or blocked storage: the old results simply stay until the next alert.
  }
}

const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

/** The most the API returns in one call (LimitQuery). */
const ALERT_LOG_LIMIT = 100;
/** Alerts shown in the analytics history chart. */
const HISTORY_LIMIT = 12;

const liveClient: DashboardClient = {
  async listBarangays() {
    return (await api<{ barangays: BarangayWithCount[] }>('/barangays')).barangays;
  },
  async getCurrentAlert() {
    // 1. The open alert (scheduled, commits open, window open, measuring), from the same query the
    //    phones use, so the dashboard and every phone always agree on what is going on. Asked first,
    //    on every poll: an alert sent from another browser or device shows up here at once.
    const { alert } = ActiveAlertResponse.parse(await api('/alerts/active'));
    if (alert) {
      sawOpenAlert = true;
      return withoutClock(alert);
    }
    // 2. Nothing open: the newest event's results, if it settled and was sent recently, so the
    //    operator can read them on any device. A cancelled event shows nothing.
    const latest = await newestEvent();
    if (
      latest &&
      latest.status === 'settled' &&
      Date.now() - Date.parse(latest.createdAt) < RECENT_RESULTS_MS &&
      latest.id !== dismissedAlertId()
    ) {
      return withoutClock(latest);
    }
    return null;
  },
  async createAlert(input) {
    // One key per confirm: a repeated request returns the same alert and sends no second push.
    return AlertView.parse(
      await api('/alerts', {
        ...json(input),
        headers: { 'idempotency-key': globalThis.crypto.randomUUID() },
      }),
    );
  },
  async cancelAlert(alertId) {
    await api(`/alerts/${alertId}/cancel`, json({}));
  },
  async listAlerts() {
    return AlertLogResponse.parse(await api(`/alerts?limit=${ALERT_LOG_LIMIT}`)).alerts;
  },
  getTotals: (alertId) => api<AlertTotals>(`/alerts/${alertId}/totals`),
  async updateTargets(alertId, targets) {
    await api(`/alerts/${alertId}/targets`, {
      ...json({ targets } satisfies UpdateTargetsInput),
      method: 'PUT',
    });
  },
  async fastForward(alertId, to) {
    await api(`/alerts/${alertId}/fast-forward`, json({ to } satisfies FastForwardInput));
  },
  async settle(alertId) {
    await api(`/alerts/${alertId}/settle`, json({}));
  },
  async listFlagged() {
    // The row shape is FlaggedReading in @kapitwatt/shared. The route's envelope is not
    // fixed yet, so both a bare list and { readings } are read.
    const body = await api<unknown>('/readings/flagged');
    const rows = Array.isArray(body) ? body : (body as { readings?: unknown } | null)?.readings;
    // Any other shape fails here rather than reading as an empty queue.
    return FlaggedReading.array().parse(rows);
  },
  async reviewReading(readingId, decision) {
    await api(`/readings/${readingId}/review`, json({ decision } satisfies ReviewReadingInput));
  },
  async readingPhoto(readingId) {
    return URL.createObjectURL(await apiBlob(`/readings/${readingId}/photo`));
  },
  simStatus: () => api<SimStatus>('/sim/status'),
  async getAnalytics(alertId) {
    return AlertAnalytics.parse(await api(`/analytics/alerts/${alertId}`));
  },
  async getAlertHistory() {
    return AlertHistoryResponse.parse(await api(`/analytics/history?limit=${HISTORY_LIMIT}`))
      .alerts;
  },
  async simSeed(params) {
    await api('/sim/seed', json(params));
  },
  simRun: (alertId, params, phase) =>
    api<SimRunSummary>('/sim/run', json({ alertId, params, phase })),
  async simReset() {
    await api('/sim/reset', json({}));
    // Start clean: stop showing the results of a finished event whose data was just deleted.
    latestEvent = null;
    const latest = await newestEvent();
    if (latest && latest.status === 'settled') dismissAlert(latest.id);
  },
};

// --- fixture -------------------------------------------------------------------

/** Fixture only: the share of simulated photo readings held for review. */
export const FIXTURE_FLAGGED_SHARE = 0.03;

let backend: MemoryBackend | null = null;

function fixtureBackend(): MemoryBackend {
  if (!backend) {
    // The fixture runs no photo checks, so it flags a few readings to give the review list rows.
    backend = new MemoryBackend({ flaggedShare: FIXTURE_FLAGGED_SHARE });
    // Start seeded so a page refresh during development lands on a usable state.
    backend.seed({ amiShare: 0.15, seed: 2026 });
  }
  return backend;
}

/** Same error type as the live client, so screens handle both alike. */
async function viaFixture<T>(work: (b: MemoryBackend) => T | Promise<T>): Promise<T> {
  try {
    return await work(fixtureBackend());
  } catch (error) {
    if (error instanceof MemoryBackendError) {
      throw new ApiError(error.status, { error: error.message });
    }
    throw error;
  }
}

const fixtureClient: DashboardClient = {
  listBarangays: () => viaFixture((b) => b.listBarangays()),
  getCurrentAlert: () => viaFixture((b) => b.currentAlert()),
  createAlert: (input) => viaFixture((b) => b.createAlert(input, 'operator (fixture)')),
  cancelAlert: (alertId) =>
    viaFixture((b) => {
      b.cancel(alertId);
    }),
  listAlerts: () => viaFixture((b) => b.listAlerts(ALERT_LOG_LIMIT)),
  getTotals: (alertId) => viaFixture((b) => b.totals(alertId)),
  updateTargets: (alertId, targets) =>
    viaFixture((b) => {
      b.updateTargets(alertId, targets);
    }),
  fastForward: (alertId, to) =>
    viaFixture((b) => {
      b.fastForward(alertId, to);
    }),
  settle: (alertId) =>
    viaFixture((b) => {
      b.settle(alertId);
    }),
  listFlagged: () => viaFixture((b) => b.listFlagged()),
  reviewReading: (readingId, decision) =>
    viaFixture((b) => {
      b.review(readingId, decision);
    }),
  readingPhoto: () =>
    viaFixture(() => {
      throw new MemoryBackendError(404, 'the fixture has no photos');
    }),
  simStatus: () => viaFixture((b) => b.status()),
  simSeed: (params) =>
    viaFixture((b) => {
      b.seed(params);
    }),
  simRun: (alertId, params, phase) => viaFixture((b) => b.run(alertId, params, phase)),
  simReset: () =>
    viaFixture((b) => {
      b.reset();
    }),
  getAnalytics: () =>
    viaFixture(() => {
      throw new MemoryBackendError(404, 'analytics need the live API');
    }),
  getAlertHistory: () =>
    viaFixture(() => {
      throw new MemoryBackendError(404, 'analytics need the live API');
    }),
};

export const client: DashboardClient = USE_FIXTURES ? fixtureClient : liveClient;

/**
 * The message from an error body. The API sends `{ error: { code, message, issues? } }`
 * (ApiErrorBody in @kapitwatt/shared); the fixture sends `{ error: 'text' }`.
 */
function errorDetail(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('error' in body)) return null;
  const { error } = body as { error: unknown };
  if (typeof error === 'string') return error;
  const parsed = ApiErrorBody.safeParse(body);
  if (!parsed.success) return null;
  const { message, issues } = parsed.data.error;
  const first = issues?.[0];
  return first ? `${message} ${first.path}: ${first.message}` : message;
}

/** A short, readable reason for a failed call. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const detail = errorDetail(error.body);
    if (error.status === 501) return 'The API has not implemented this endpoint yet (501).';
    if (error.status === 401) return 'The API rejected the key (401). Check the dashboard .env.';
    if (error.status === 404) return detail ?? 'Not found (404).';
    return detail ? `${detail} (${error.status})` : `The API returned ${error.status}.`;
  }
  if (error instanceof Error) return `Cannot reach the API: ${error.message}`;
  return 'Something went wrong.';
}
