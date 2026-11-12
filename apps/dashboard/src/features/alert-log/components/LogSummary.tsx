import type { AlertHistoryItem } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { FigureTile } from '@/components/FigureTile';
import { Grid } from '@/components/Grid';
import type { DashboardAlert } from '@/api/client';
import { php } from '@/utils/format';

const WEEK = 7 * 24 * 3_600_000;

/**
 * Four figures over the log: alerts in the last 7 days, red against yellow, how settled alerts did
 * against their targets, and what was paid. The last two come from the analytics history (live API
 * only), so they show a dash when it is not available.
 */
export function LogSummary({
  alerts,
  history,
}: {
  alerts: DashboardAlert[];
  history?: AlertHistoryItem[];
}) {
  const t = useTheme();
  const c = t.color;
  const now = Date.now();
  const thisWeek = alerts.filter((a) => now - new Date(a.createdAt).getTime() < WEEK).length;
  const red = alerts.filter((a) => a.level === 'red').length;
  const settled = (history ?? []).filter(
    (h) => h.status === 'settled' && h.deliveredKw !== null && h.targetKw > 0,
  );
  const share =
    settled.length > 0
      ? settled.reduce((s, h) => s + (h.deliveredKw as number) / h.targetKw, 0) / settled.length
      : undefined;
  const paid = history?.reduce((s, h) => s + h.paidPhp, 0);

  return (
    <Grid min={190} columns={[4, 2, 1]}>
      {[
        <FigureTile
          key="sent"
          label="Alerts sent"
          icon="send"
          value={String(thisWeek)}
          unit=""
          note={`In the last 7 days · ${alerts.length} in the log`}
          bg={c.primaryContainer}
          fg={c.onPrimaryContainer}
        />,
        <FigureTile
          key="level"
          label="Red / yellow"
          icon="alert"
          value={`${red} / ${alerts.length - red}`}
          unit=""
          note="By NGCP alert level"
          bg={c.alertRedContainer}
          fg={c.onAlertRedContainer}
        />,
        <FigureTile
          key="delivered"
          label="Delivered vs target"
          icon="verified"
          value={share === undefined ? undefined : String(Math.round(share * 100))}
          unit={share === undefined ? '' : '%'}
          note={
            share === undefined
              ? 'No settled alert in the history'
              : `Average over ${settled.length} settled ${settled.length === 1 ? 'alert' : 'alerts'}`
          }
          bg={c.reliefContainer}
          fg={c.onReliefContainer}
        />,
        <FigureTile
          key="paid"
          label="Paid out"
          icon="reward"
          value={paid === undefined ? undefined : php(paid).replace('PHP ', '')}
          unit={paid === undefined ? '' : 'PHP'}
          note={paid === undefined ? 'Needs the live API' : 'Credits and barangay bonuses'}
          bg={c.surfaceContainerLowest}
          fg={c.onSurface}
          dashed
        />,
      ]}
    </Grid>
  );
}
