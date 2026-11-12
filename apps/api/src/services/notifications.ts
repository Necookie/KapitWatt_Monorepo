import {
  cancelAlertRow,
  claimDueReminders,
  claimDueScheduledAlerts,
  claimLiftedPush,
  getAlert,
  photoReminderRecipients,
  pushRecipients,
  type Db,
  type ReminderKind,
} from '@kapitwatt/db';
import { PHOTO_RULES, REMINDER_BEFORE_WINDOW_MIN, type AlertView } from '@kapitwatt/shared';
import { conflict, notFound } from '../lib/errors';
import { logError } from '../lib/log';
import { toAlertView } from './alert-view';
import { dispatchAlertPush, pushToTokens, windowText } from './push';

/**
 * P1 notifications: cancel with the alert-lifted push, scheduled sends and reminder pushes. Every
 * send is claimed in the database first (a *_sent_at column set in the same statement), so a retry
 * or an overlapping cron run never sends the same push twice.
 */

/** FR-API-17: cancel an alert; households that were alerted get an alert-lifted push. */
export async function cancelAlert(
  db: Db,
  alertId: string,
  isDemo: boolean,
): Promise<{ view: AlertView; liftedPush: () => Promise<void> }> {
  const before = await getAlert(db, alertId, isDemo);
  if (!before) throw notFound('Alert');
  const previous = await cancelAlertRow(db, alertId);
  if (previous === null)
    throw conflict('alert_closed', 'Only an alert that has not settled can be cancelled.');
  const alert = await getAlert(db, alertId, isDemo);
  if (!alert) throw notFound('Alert');
  const liftedPush = async () => {
    // A scheduled alert was never sent, so there is nobody to tell.
    if (previous !== 'active' || !(await claimLiftedPush(db, alertId))) return;
    const tokens = await pushRecipients(db, alertId);
    await pushToTokens(
      db,
      tokens,
      {
        type: 'alert_lifted',
        alertId,
        title: 'Alert lifted',
        body: 'No need to cut load. Thank you for standing by.',
      },
      undefined,
    );
  };
  return { view: toAlertView(alert), liftedPush };
}

const REMINDERS: Record<ReminderKind, (window: string) => { title: string; body: string }> = {
  pre_window: (w) => ({
    title: `Peak window starts in ${REMINDER_BEFORE_WINDOW_MIN} minutes`,
    body: `${w}. Commit a cut in the app if you have not yet.`,
  }),
  before_photo: () => ({
    title: 'Take your before photo now',
    body: `The peak window has started. Send your meter photo within ${PHOTO_RULES.beforeDeadlineMin} minutes.`,
  }),
  after_photo: () => ({
    title: 'Take your after photo now',
    body: `The peak window has ended. Send your meter photo within ${PHOTO_RULES.afterDeadlineMin} minutes.`,
  }),
};

/**
 * Cron step: send scheduled alerts that are due, then the reminders that are due. Errors are logged
 * per alert and never stop the rest. Returns how many pushes went out (alerts plus reminders).
 */
export async function runNotifications(
  db: Db,
  isDemo: boolean,
  accessToken: string | undefined,
): Promise<number> {
  let sent = 0;
  for (const id of await claimDueScheduledAlerts(db)) {
    try {
      const alert = await getAlert(db, id, isDemo);
      if (alert) {
        await dispatchAlertPush(db, alert, accessToken);
        sent++;
      }
    } catch (err) {
      logError('scheduled_send_failed', err, { alertId: id });
    }
  }
  const opts = {
    isDemo,
    leadMinutes: REMINDER_BEFORE_WINDOW_MIN,
    beforeMinutes: PHOTO_RULES.beforeDeadlineMin,
    afterMinutes: PHOTO_RULES.afterDeadlineMin,
  };
  for (const kind of ['pre_window', 'before_photo', 'after_photo'] as const) {
    for (const id of await claimDueReminders(db, kind, opts)) {
      try {
        const alert = await getAlert(db, id, isDemo);
        if (!alert) continue;
        const tokens =
          kind === 'pre_window'
            ? await pushRecipients(db, id)
            : await photoReminderRecipients(db, id, kind === 'before_photo' ? 'before' : 'after');
        await pushToTokens(
          db,
          tokens,
          { type: 'reminder', alertId: id, ...REMINDERS[kind](windowText(alert)) },
          accessToken,
        );
        sent++;
      } catch (err) {
        logError('reminder_failed', err, { alertId: id, kind });
      }
    }
  }
  return sent;
}
