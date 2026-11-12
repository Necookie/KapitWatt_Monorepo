import {
  CreateAlertInput,
  FastForwardInput,
  UpdateTargetsInput,
  type ActiveAlertResponse,
  type AlertLogResponse,
} from '@kapitwatt/shared';
import type { Context } from 'hono';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { defer } from '../lib/defer';
import { AppError } from '../lib/errors';
import { IDEMPOTENCY_KEY, IdParam, LimitQuery } from '../lib/params';
import { validate } from '../lib/validate';
import { demoOnly, operatorAuth, optionalHouseholdAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rate-limit';
import * as alertsService from '../services/alerts';
import { toAlertView } from '../services/alert-view';
import { dispatchAlertPush } from '../services/push';
import { cancelAlert } from '../services/notifications';
import { settleAlert } from '../services/settlement';
import { alertTotals } from '../services/totals';

export const alerts = new Hono<AppEnv>();

const isDemo = (c: Context<AppEnv>) => c.env.APP_ENV === 'demo';
const operatorLimit = rateLimit('RL_OPERATOR', () => 'operator');

/** Only one shared operator key exists in the demo, so the logged sender is the role. */
const OPERATOR_SENDER = 'operator';

function idempotencyKey(c: Context<AppEnv>): string | null {
  const key = c.req.header('idempotency-key');
  if (key === undefined) return null;
  if (!IDEMPOTENCY_KEY.test(key)) {
    throw new AppError(
      400,
      'invalid_request',
      'Idempotency-Key must be 8 to 100 URL-safe characters.',
    );
  }
  return key;
}

// Alert log, newest first (operator). FR-DASH-13.
alerts.get('/', operatorAuth, operatorLimit, validate('query', LimitQuery), async (c) => {
  const body: AlertLogResponse = {
    alerts: await alertsService.alertLog(c.var.db, c.req.valid('query').limit, isDemo(c)),
  };
  return c.json(body);
});

// Operator raises a yellow or red alert: store it with sender and time, split the target across
// barangays, then push to opted-in phones in the targeted barangays after responding.
// Send an Idempotency-Key header per confirm: a repeat returns the same alert and sends nothing.
alerts.post('/', operatorAuth, operatorLimit, validate('json', CreateAlertInput), async (c) => {
  const { alert, created } = await alertsService.createAlert(c.var.db, c.req.valid('json'), {
    createdBy: OPERATOR_SENDER,
    idempotencyKey: idempotencyKey(c),
    isDemo: isDemo(c),
  });
  // A scheduled alert is pushed by the cron at its send time, not now.
  if (created && alert.storedStatus === 'active') {
    defer(c, 'push_dispatch', dispatchAlertPush(c.var.db, alert, c.env.EXPO_ACCESS_TOKEN));
  }
  return c.json(toAlertView(alert), created ? 201 : 200);
});

// The alert a household should be looking at (pull-to-refresh fallback if push is slow). With a
// household token: the newest open alert for its barangay. Without: the newest open alert.
alerts.get('/active', optionalHouseholdAuth, async (c) => {
  const householdId = c.get('actor') === 'household' ? c.var.householdId : null;
  const body: ActiveAlertResponse = {
    alert: await alertsService.activeAlert(c.var.db, householdId, isDemo(c)),
  };
  return c.json(body);
});

alerts.get('/:id', validate('param', IdParam), async (c) =>
  c.json(await alertsService.getAlertView(c.var.db, c.req.valid('param').id, isDemo(c))),
);

// Live committed and delivered kW, total and per barangay. The dashboard polls this every ~2 s.
// Aggregates per barangay only, never household rows.
alerts.get('/:id/totals', validate('param', IdParam), async (c) =>
  c.json(await alertTotals(c.var.db, c.req.valid('param').id, isDemo(c))),
);

// Operator override of barangay shares of the target.
alerts.put(
  '/:id/targets',
  operatorAuth,
  operatorLimit,
  validate('param', IdParam),
  validate('json', UpdateTargetsInput),
  async (c) =>
    c.json(
      await alertsService.updateTargets(
        c.var.db,
        c.req.valid('param').id,
        c.req.valid('json'),
        isDemo(c),
      ),
    ),
);

// "Measure (fast-forward)", demo only: move the alert's clock to window start (commits close, before
// photos open) or window end (after photos open). Never backwards; settle is a separate call.
alerts.post(
  '/:id/fast-forward',
  demoOnly,
  operatorAuth,
  operatorLimit,
  validate('param', IdParam),
  validate('json', FastForwardInput),
  async (c) =>
    c.json(
      await alertsService.fastForward(
        c.var.db,
        c.req.valid('param').id,
        c.req.valid('json').to,
        isDemo(c),
      ),
    ),
);

// Settle now (the operator's button; the cron settles automatically at window end + 30 min). Only
// after the window has ended. Idempotent: settling a settled alert returns the recorded result.
alerts.post('/:id/settle', operatorAuth, operatorLimit, validate('param', IdParam), async (c) =>
  c.json(await settleAlert(c.var.db, c.req.valid('param').id, { isDemo: isDemo(c), force: true })),
);

// P1: end an alert early and send the alert-lifted push.
// End an alert (scheduled or active). Households that were alerted get an alert-lifted push.
alerts.post('/:id/cancel', operatorAuth, operatorLimit, validate('param', IdParam), async (c) => {
  const { view, liftedPush } = await cancelAlert(c.var.db, c.req.valid('param').id, isDemo(c));
  defer(c, 'lifted_push', liftedPush());
  return c.json(view);
});
