import {
  clearPushTokens,
  markPushSent,
  pushRecipients,
  type AlertRow,
  type Db,
} from '@kapitwatt/db';
import { logInfo, logWarn } from '../lib/log';

/**
 * Expo Push: the ONLY place the system sends push notifications (architecture rule 4). Recipients are
 * real, opted-in households with a token in the alert's barangays; simulated households never get
 * one. Runs after the response (see defer), so a push failure never fails alert creation: the alert
 * is stored and the app finds it on refresh.
 */
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
/** Expo accepts at most 100 messages per request. */
const BATCH = 100;

/** What the app routes on: open the event screen for alertId. */
export type PushType = 'grid_alert' | 'reminder' | 'alert_lifted';

export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  priority: 'high';
  data: { type: PushType; alertId: string };
}

type ExpoTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message?: string; details?: { error?: string } };

const manilaTime = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function alertTitle(a: Pick<AlertRow, 'level' | 'windowStart' | 'windowEnd'>): string {
  const level = a.level === 'red' ? 'Red alert' : 'Yellow alert';
  return `${level}: cut load ${manilaTime.format(a.windowStart)} to ${manilaTime.format(a.windowEnd)}`;
}

export function buildMessages(
  a: Pick<AlertRow, 'id' | 'level' | 'windowStart' | 'windowEnd' | 'message'>,
  tokens: string[],
): ExpoMessage[] {
  const title = alertTitle(a);
  return tokens.map((to) => ({
    to,
    title,
    body: a.message,
    sound: 'default',
    priority: 'high',
    data: { type: 'grid_alert', alertId: a.id },
  }));
}

export interface PushOutcome {
  sent: number;
  failed: number;
  /** Tokens Expo says are no longer registered; cleared from households. */
  unregistered: string[];
}

/** Sends in batches of 100 and reads the tickets. `fetchFn` is injectable for tests. */
export async function sendExpo(
  messages: ExpoMessage[],
  accessToken: string | undefined,
  fetchFn: typeof fetch = fetch,
): Promise<PushOutcome> {
  const out: PushOutcome = { sent: 0, failed: 0, unregistered: [] };
  for (let i = 0; i < messages.length; i += BATCH) {
    const batch = messages.slice(i, i + BATCH);
    const res = await fetchFn(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      out.failed += batch.length;
      logWarn('push_batch_failed', { status: res.status, size: batch.length });
      continue;
    }
    const { data } = (await res.json()) as { data?: ExpoTicket[] };
    batch.forEach((m, j) => {
      const ticket = data?.[j];
      if (ticket?.status === 'ok') {
        out.sent++;
        return;
      }
      out.failed++;
      if (ticket?.details?.error === 'DeviceNotRegistered') out.unregistered.push(m.to);
    });
  }
  return out;
}

/** Push an alert to its recipients, then record the outcome. Logs counts only, never tokens. */
export async function dispatchAlertPush(
  db: Db,
  alert: AlertRow,
  accessToken: string | undefined,
  fetchFn: typeof fetch = fetch,
): Promise<PushOutcome> {
  const tokens = await pushRecipients(db, alert.id);
  const outcome = await sendExpo(buildMessages(alert, tokens), accessToken, fetchFn);
  await clearPushTokens(db, outcome.unregistered);
  if (outcome.sent > 0) await markPushSent(db, alert.id);
  logInfo('push_dispatched', {
    alertId: alert.id,
    recipients: tokens.length,
    sent: outcome.sent,
    failed: outcome.failed,
    unregistered: outcome.unregistered.length,
  });
  return outcome;
}

/**
 * Sends one message to a set of tokens and records the outcome (clears unregistered tokens). Used
 * for reminders and the alert-lifted push; recipients always come from queries limited to real,
 * opted-in households with a token.
 */
export async function pushToTokens(
  db: Db,
  tokens: string[],
  message: { title: string; body: string; type: PushType; alertId: string },
  accessToken: string | undefined,
  fetchFn: typeof fetch = fetch,
): Promise<PushOutcome> {
  const messages: ExpoMessage[] = tokens.map((to) => ({
    to,
    title: message.title,
    body: message.body,
    sound: 'default',
    priority: 'high',
    data: { type: message.type, alertId: message.alertId },
  }));
  const outcome = await sendExpo(messages, accessToken, fetchFn);
  await clearPushTokens(db, outcome.unregistered);
  logInfo('push_sent', {
    alertId: message.alertId,
    type: message.type,
    recipients: tokens.length,
    sent: outcome.sent,
    failed: outcome.failed,
  });
  return outcome;
}

/** The window in Manila time, e.g. "18:00 to 20:00". */
export const windowText = (a: Pick<AlertRow, 'windowStart' | 'windowEnd'>) =>
  `${manilaTime.format(a.windowStart)} to ${manilaTime.format(a.windowEnd)}`;
