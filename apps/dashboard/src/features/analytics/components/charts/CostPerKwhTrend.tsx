import type { AlertHistoryItem } from '@kapitwatt/shared';
import { Stack, Text } from '@kapitwatt/ui';
import { dayAndClock, kw, php } from '@/utils/format';
import { useChartColors } from '../../hooks/useChartColors';
import { niceMax, nonScaling, W } from '../../utils/plot';
import { ChartLegend } from '../ChartLegend';
import { Empty } from '../Empty';
import { Plot } from './Plot';

/** Pesos paid per verified kWh for each settled alert, against the placeholder rate. */
export function CostPerKwhTrend({ alerts, rate }: { alerts: AlertHistoryItem[]; rate: number }) {
  const c = useChartColors();
  const settled = [...alerts].reverse().filter((a) => a.verifiedKwh > 0);
  if (settled.length === 0) return <Empty>No settled alerts yet.</Empty>;
  const values = settled.map((a) => a.paidPhp / a.verifiedKwh);
  const max = niceMax(Math.max(rate, ...values) * 1.1);
  const n = settled.length;
  const xAt = (i: number) => (n === 1 ? 0.5 : i / (n - 1));
  return (
    <Stack gap={3}>
      <ChartLegend
        items={[
          { color: c.committed, label: 'Paid per verified kWh (credit + bonus)' },
          { color: c.target, label: `Placeholder rate ${php(rate)}`, dashed: true },
        ]}
      />
      <Plot
        height={170}
        yMax={max}
        yFormat={(v) => `₱${Number.isInteger(v) ? v : v.toFixed(1)}`}
        xLabels={settled.map((a, i) => ({ at: xAt(i), text: dayAndClock(a.windowStart) }))}
        label={`Cost per verified kWh over ${n} settled alerts.`}
        hover={(share) => {
          const i = Math.round(share * (n - 1));
          const a = settled[i]!;
          return {
            xShare: xAt(i),
            yPx: 166 - (values[i]! / max) * 158,
            lines: [
              dayAndClock(a.windowStart),
              `${php(values[i]!)} per kWh`,
              `${php(a.paidPhp)} for ${kw(a.verifiedKwh)} kWh`,
            ],
          };
        }}
      >
        {(y) => (
          <>
            <line
              x1={0}
              x2={W}
              y1={y(rate)}
              y2={y(rate)}
              stroke={c.target}
              strokeWidth={2}
              strokeDasharray="6 5"
              {...nonScaling}
            />
            <path
              d={values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i) * W},${y(v)}`).join(' ')}
              fill="none"
              stroke={c.committed}
              strokeWidth={2.5}
              {...nonScaling}
            />
            {values.map((v, i) => (
              <ellipse
                key={settled[i]!.alertId}
                cx={xAt(i) * W}
                cy={y(v)}
                rx={5 * (W / 700)}
                ry={5}
                fill={c.committed}
              />
            ))}
          </>
        )}
      </Plot>
      <Text variant="bodySmall" color="onSurfaceVariant">
        Below the rate because photo households earn the 0.6 multiplier; the barangay bonus pushes
        it up. All reward numbers are placeholders.
      </Text>
    </Stack>
  );
}
