import type { AlertRow, StoredAlertStatus } from '@kapitwatt/db';
import type { AlertStatus, AlertView } from '@kapitwatt/shared';

/**
 * The status a client sees, derived from the stored status and the alert's effective time:
 *   cancelled / settled / settling (a settlement in progress) as stored, otherwise
 *   active (commits open) before window start, window_open during the window, and
 *   settling after window end (waiting for after photos and settlement).
 */
export function deriveAlertStatus(
  stored: StoredAlertStatus,
  windowStart: Date,
  windowEnd: Date,
  now: Date,
): AlertStatus {
  if (stored === 'cancelled' || stored === 'settled' || stored === 'settling') return stored;
  if (stored === 'scheduled') return 'scheduled';
  if (now < windowStart) return 'active';
  if (now < windowEnd) return 'window_open';
  return 'settling';
}

export function toAlertView(a: AlertRow): AlertView {
  return {
    id: a.id,
    level: a.level,
    windowStart: a.windowStart.toISOString(),
    windowEnd: a.windowEnd.toISOString(),
    targetKw: a.targetKw,
    targetBarangayIds: a.targetBarangayIds,
    message: a.message,
    status: deriveAlertStatus(a.storedStatus, a.windowStart, a.windowEnd, a.effectiveNow),
    createdBy: a.createdBy,
    createdAt: a.createdAt.toISOString(),
    pushSentAt: a.pushSentAt?.toISOString() ?? null,
    sendAt: a.sendAt?.toISOString() ?? null,
    serverNow: a.effectiveNow.toISOString(),
  };
}
