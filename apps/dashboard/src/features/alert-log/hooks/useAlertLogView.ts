import type { AlertLevel } from '@kapitwatt/shared';
import { useState } from 'react';
import type { DashboardAlert } from '@/api/client';
import { useAlertHistory, useBarangays, useCurrentAlert } from '@/api/queries';
import { useAlertLog } from '../api/useAlertLog';
import { dayLabel } from '../utils/day-label';
import type { Stage } from '../utils/filters';
import { reach } from '../utils/reach';
import { IN_PROGRESS } from '../utils/status';

/**
 * The alert log as the page shows it: the level and stage filters, the alerts that pass them grouped
 * by day (newest first, as the API returns them), the open row, and per-alert history and reach.
 */
export function useAlertLogView() {
  const log = useAlertLog();
  const history = useAlertHistory();
  const current = useCurrentAlert();
  const barangays = useBarangays();
  const [level, setLevel] = useState<AlertLevel | 'all'>('all');
  const [stage, setStage] = useState<Stage>('all');
  const [open, setOpen] = useState<string | null>(null);

  const townOf = new Map((barangays.data ?? []).map((b) => [b.id, b.municipality]));
  const pilotSize = barangays.data?.length ?? 0;

  const alerts = log.data ?? [];
  const byId = new Map((history.data ?? []).map((h) => [h.alertId, h]));
  const shown = alerts.filter(
    (a) =>
      (level === 'all' || a.level === level) &&
      (stage === 'all' ||
        (stage === 'progress' ? IN_PROGRESS.includes(a.status) : a.status === stage)),
  );
  const days: [string, DashboardAlert[]][] = [];
  for (const a of shown) {
    const label = dayLabel(a.createdAt);
    const last = days[days.length - 1];
    if (last && last[0] === label) last[1].push(a);
    else days.push([label, [a]]);
  }

  return {
    log,
    history,
    alerts,
    shown,
    days,
    level,
    setLevel,
    stage,
    setStage,
    open,
    toggle: (id: string) => setOpen(open === id ? null : id),
    currentId: current.data?.id,
    historyOf: (id: string) => byId.get(id),
    reachOf: (a: DashboardAlert) => reach(a, townOf, pilotSize),
  };
}
