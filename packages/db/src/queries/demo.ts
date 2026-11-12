import type { MeterType } from '@kapitwatt/shared';
import type { Db } from '../index';

/**
 * Demo-only queries behind `pnpm demo:reset` (apps/api/scripts/demo-reset.ts) and the live smart-meter
 * feed for the demo accounts. Never called by a route a household or the operator can reach.
 */

export interface DemoHouseholdRow {
  id: string;
  email: string;
  barangayId: string;
  meterType: MeterType;
  billAvgKwhMonth: number;
  baselineKw: number | null;
  trustScore: number;
  /** The latest meter reading on record, or null if the household never sent one. */
  lastReadingKwh: number | null;
  lastReadingAt: Date | null;
}

/** The demo accounts, by email. */
export async function listDemoHouseholds(db: Db): Promise<DemoHouseholdRow[]> {
  const rows = await db`
    select h.id, h.email, h.barangay_id, h.meter_type, h.bill_avg_kwh_month, h.baseline_kw,
           h.trust_score, last.reading_kwh, last.captured_at
    from households h
    left join lateral (
      select m.reading_kwh, m.captured_at from meter_readings m
      where m.household_id = h.id order by m.captured_at desc limit 1
    ) last on true
    where h.is_demo
    order by h.email`;
  return rows.map((r) => ({
    id: r.id as string,
    email: r.email as string,
    barangayId: r.barangay_id as string,
    meterType: r.meter_type as MeterType,
    billAvgKwhMonth: Number(r.bill_avg_kwh_month),
    baselineKw: r.baseline_kw === null ? null : Number(r.baseline_kw),
    trustScore: Number(r.trust_score),
    lastReadingKwh: r.reading_kwh === null ? null : Number(r.reading_kwh),
    lastReadingAt: (r.captured_at as Date | null) ?? null,
  }));
}

/**
 * Marks an existing demo account as a demo household and puts it where the demo wants it. Only a row
 * the demo setup registered (its DEMO- meter serial) is touched; an email match alone is not enough.
 */
export async function setDemoHousehold(
  db: Db,
  email: string,
  fields: {
    barangayId: string;
    serviceAddress: string;
    baselineKw: number | null;
    lat: number;
    lng: number;
  },
): Promise<string | null> {
  const [r] = await db`
    update households
    set is_demo = true, barangay_id = ${fields.barangayId}, service_address = ${fields.serviceAddress},
        baseline_kw = ${fields.baselineKw}, lat = ${fields.lat}, lng = ${fields.lng},
        trust_score = 50, opted_in = true
    where email = ${email} and meter_serial like 'DEMO-%' and not is_simulated
    returning id`;
  return r ? (r.id as string) : null;
}

export interface DemoWipeResult {
  alerts: number;
  simulated: number;
  orphans: number;
}

/**
 * The clean slate before a demo. Deletes, in one transaction:
 *   every alert (with, by cascade, its commitments, readings, rewards, targets and settlement);
 *   every simulated household (and its smart-meter intervals);
 *   orphan sign-ups: real households with no email that nobody uses: no login token, or a token but
 *   never a practice run and no push token (a sign-up the phone reported as failed, which never kept
 *   the token). An older household in use (baseline or push token) is kept: a phone holds its token;
 *   the demo accounts' own leftover readings and intervals (a practice run done on stage).
 * Real households with a login keep their rows; their event history goes with the alerts.
 */
export async function wipeDemoWorld(db: Db): Promise<DemoWipeResult> {
  const [alerts, simulated, orphans] = await db.transaction([
    db`delete from alerts returning id`,
    db`delete from households where is_simulated returning id`,
    db`delete from households
       where not is_simulated and not is_demo and email is null
         and (auth_token_hash is null or (baseline_kw is null and push_token is null))
       returning id`,
    db`delete from meter_readings m using households h
       where m.household_id = h.id and h.is_demo`,
    // Every interval the fake feed wrote (is_simulated), including those of real smart-meter
    // households, plus anything left on a demo account.
    db`delete from ami_intervals i using households h
       where i.household_id = h.id and (h.is_demo or i.is_simulated)`,
  ]);
  return {
    alerts: alerts?.length ?? 0,
    simulated: simulated?.length ?? 0,
    orphans: orphans?.length ?? 0,
  };
}

/**
 * A replayed past event sends nothing: its push and every reminder are marked as already handled
 * before anything else happens, so neither the route nor the cron ever pushes it to a phone.
 */
export async function quietAlert(db: Db, alertId: string): Promise<void> {
  await db`
    update alerts
    set push_sent_at = now(), reminder_sent_at = now(), before_reminder_sent_at = now(),
        after_reminder_sent_at = now()
    where id = ${alertId}`;
}

/**
 * Moves a settled event back in time by `shiftSec` seconds (negative), everything it owns with it:
 * the alert's window and timestamps, its commitments, readings, smart-meter intervals, rewards and
 * settlement. The payout figures are untouched; only the dates move. `leadMinutes`: how long before
 * the window the alert is shown as sent. One transaction; the intervals move first, while the
 * alert still holds its original window.
 */
export async function backdateAlert(
  db: Db,
  alertId: string,
  shiftSec: number,
  leadMinutes: number,
): Promise<void> {
  const shift = db`make_interval(secs => ${shiftSec})`;
  await db.transaction([
    db`update ami_intervals i set interval_start = i.interval_start + ${shift}
       from commitments c join alerts a on a.id = c.alert_id
       where c.alert_id = ${alertId} and c.path = 'ami' and i.household_id = c.household_id
         and i.interval_start >= a.window_start and i.interval_start < a.window_end`,
    db`update meter_readings m
       set captured_at = m.captured_at + ${shift}, received_at = m.received_at + ${shift},
           reviewed_at = m.reviewed_at + ${shift}
       from commitments c where m.commitment_id = c.id and c.alert_id = ${alertId}`,
    db`update rewards r set created_at = r.created_at + ${shift}
       from commitments c where r.commitment_id = c.id and c.alert_id = ${alertId}`,
    db`update commitments set created_at = created_at + ${shift} where alert_id = ${alertId}`,
    db`update settlements set settled_at = settled_at + ${shift} where alert_id = ${alertId}`,
    db`update alerts
       set window_start = window_start + ${shift}, window_end = window_end + ${shift},
           created_at = window_start + ${shift} - make_interval(mins => ${leadMinutes}),
           settled_at = settled_at + ${shift}, push_sent_at = push_sent_at + ${shift},
           reminder_sent_at = reminder_sent_at + ${shift},
           before_reminder_sent_at = before_reminder_sent_at + ${shift},
           after_reminder_sent_at = after_reminder_sent_at + ${shift},
           clock_offset_sec = 0
       where id = ${alertId}`,
  ]);
}

export interface DemoAmiCommitmentRow {
  householdId: string;
  committedKw: number;
  baselineKw: number;
}

/**
 * Real households (demo accounts and anyone who signed up on a phone) on the smart-meter path that
 * committed to this alert. There is no real Meralco AMI feed in the pilot, so in a live event the
 * fake smart-meter feed stands in for the meter, as it does for simulated rows. The commitment is
 * still the tester's own.
 */
export async function listDemoAmiCommitments(
  db: Db,
  alertId: string,
): Promise<DemoAmiCommitmentRow[]> {
  const rows = await db`
    select c.household_id, c.committed_kw, c.baseline_kw
    from commitments c join households h on h.id = c.household_id
    where c.alert_id = ${alertId} and c.path = 'ami' and not h.is_simulated`;
  return rows.map((r) => ({
    householdId: r.household_id as string,
    committedKw: Number(r.committed_kw),
    baselineKw: Number(r.baseline_kw),
  }));
}
