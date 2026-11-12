import { zValidator } from '@hono/zod-validator';
import { CreateAlertInput } from '@kapitwatt/shared';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { notImplemented } from '../lib/todo';
import { operatorAuth } from '../middleware/auth';

export const alerts = new Hono<AppEnv>();

// Operator raises a yellow or red alert: store it, log sender and time, split the
// target across barangays, then push to opted-in tokens in the targeted barangays.
alerts.post('/', operatorAuth, zValidator('json', CreateAlertInput), (c) =>
  notImplemented(c, 'create alert + push dispatch'),
);

// The alert a household should currently be looking at (pull-to-refresh fallback if push is slow).
alerts.get('/active', (c) => notImplemented(c, 'get active alert'));

alerts.get('/:id', (c) => notImplemented(c, 'get alert'));

// Live committed and delivered kW, total and per barangay. The dashboard polls this every ~2 s.
alerts.get('/:id/totals', (c) => notImplemented(c, 'alert totals'));

// "Measure (fast-forward)": end the window, compress the photo timers in demo mode, then settle.
alerts.post('/:id/fast-forward', operatorAuth, (c) => notImplemented(c, 'fast-forward window'));

// Settlement (window end + 30 min): verified kWh, barangay target check, credit, points, bonus.
alerts.post('/:id/settle', operatorAuth, (c) => notImplemented(c, 'settle alert'));

// P1: end an alert early and send the alert-lifted push.
alerts.post('/:id/cancel', operatorAuth, (c) => notImplemented(c, 'cancel alert'));
