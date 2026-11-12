import type { BarangayTotals } from '@kapitwatt/shared';
import { withAlpha } from '@kapitwatt/tokens';
import { Stack } from '@kapitwatt/ui';
import { useState } from 'react';
import { kw, percent } from '@/utils/format';
import { useChartColors } from '../../hooks/useChartColors';
import { niceMax, nonScaling, W } from '../../utils/plot';
import { ChartLegend } from '../ChartLegend';
import { Empty } from '../Empty';
import { Plot } from './Plot';

/**
 * Committed vs delivered kW per barangay. Points on the dashed line delivered everything they
 * committed; the further below it, the more was lost. Point size is the barangay's households.
 */
export function CommitDeliverScatter({ barangays }: { barangays: BarangayTotals[] }) {
  const c = useChartColors();
  const [hover, setHover] = useState<BarangayTotals | null>(null);
  if (barangays.length === 0) return <Empty>No barangays targeted.</Empty>;
  const max = niceMax(
    Math.max(...barangays.map((b) => Math.max(b.committedKw, b.deliveredKw)), 1) * 1.05,
  );
  const H = 360;
  const size = (b: BarangayTotals) => 4 + Math.sqrt(b.households ?? 1) * 0.55;
  return (
    <Stack gap={3}>
      <ChartLegend
        items={[
          { color: c.delivered, label: 'Reached target' },
          { color: c.committed, label: 'Below target' },
          { color: c.baseline, label: 'Delivered = committed', dashed: true },
        ]}
      />
      <Plot
        height={H}
        yMax={max}
        yFormat={(v) => kw(v)}
        xLabels={[
          { at: 0, text: '0' },
          { at: 0.5, text: `${kw(max / 2)} kW committed` },
          { at: 1, text: `${kw(max)}` },
        ]}
        label="Committed against delivered kW for each barangay."
        hover={(share) => {
          const xKw = share * max;
          const nearest = [...barangays].sort(
            (a, b) => Math.abs(a.committedKw - xKw) - Math.abs(b.committedKw - xKw),
          )[0]!;
          setHover(nearest);
          return {
            xShare: nearest.committedKw / max,
            yPx: H - 4 - (nearest.deliveredKw / max) * (H - 12),
            lines: [
              `${nearest.name}, ${nearest.municipality}`,
              `${kw(nearest.committedKw)} kW committed`,
              `${kw(nearest.deliveredKw)} kW delivered (${percent(nearest.deliveredKw, nearest.committedKw)})`,
            ],
          };
        }}
      >
        {(y) => (
          <>
            <line
              x1={0}
              y1={y(0)}
              x2={W}
              y2={y(max)}
              stroke={c.baseline}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              {...nonScaling}
            />
            {barangays.map((b) => {
              const cx = (b.committedKw / max) * W;
              const r = size(b);
              const active = hover?.barangayId === b.barangayId;
              return (
                <ellipse
                  key={b.barangayId}
                  cx={cx}
                  cy={y(b.deliveredKw)}
                  rx={r * (W / 700)}
                  ry={r}
                  fill={withAlpha(b.targetHit ? c.delivered : c.committed, active ? 0.95 : 0.55)}
                  stroke={b.targetHit ? c.delivered : c.committed}
                  strokeWidth={1}
                  {...nonScaling}
                />
              );
            })}
          </>
        )}
      </Plot>
    </Stack>
  );
}
