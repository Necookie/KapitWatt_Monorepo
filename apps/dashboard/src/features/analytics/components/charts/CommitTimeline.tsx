import type { AlertAnalytics } from '@kapitwatt/shared';
import { withAlpha } from '@kapitwatt/tokens';
import { Stack } from '@kapitwatt/ui';
import { count, kw } from '@/utils/format';
import { useChartColors } from '../../hooks/useChartColors';
import { niceMax, nonScaling, W } from '../../utils/plot';
import { ChartLegend } from '../ChartLegend';
import { Empty } from '../Empty';
import { Plot } from './Plot';

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

/** Committed kW over the commit phase as a step area, against the target, with a hover readout. */
export function CommitTimeline({
  timeline,
  targetKw,
}: {
  timeline: AlertAnalytics['timeline'];
  targetKw: number;
}) {
  const c = useChartColors();
  if (timeline.length === 0) return <Empty>No commitments yet.</Empty>;
  const t0 = new Date(timeline[0]!.at).getTime();
  const t1 = new Date(timeline[timeline.length - 1]!.at).getTime();
  const span = Math.max(t1 - t0, 1);
  const xs = (iso: string) => ((new Date(iso).getTime() - t0) / span) * W;
  const last = timeline[timeline.length - 1]!;
  const yMax = niceMax(Math.max(targetKw, last.committedKw) * 1.05);
  const crossing = timeline.find((p) => p.committedKw >= targetKw);
  return (
    <Stack gap={3}>
      <ChartLegend
        items={[
          {
            color: c.committed,
            label: `Committed: ${kw(last.committedKw)} kW from ${count(last.households)} households`,
          },
          { color: c.target, label: `Target: ${kw(targetKw)} kW`, dashed: true },
        ]}
      />
      <Plot
        height={220}
        yMax={yMax}
        yFormat={(v) => `${kw(v)}`}
        xLabels={[
          { at: 0, text: time(timeline[0]!.at) },
          ...(crossing
            ? [{ at: xs(crossing.at) / W, text: `Target reached ${time(crossing.at)}` }]
            : []),
          { at: 1, text: time(last.at) },
        ]}
        label={`Committed load rose to ${kw(last.committedKw)} kW against a ${kw(targetKw)} kW target${crossing ? `, reaching it at ${time(crossing.at)}` : ''}.`}
        hover={(share) => {
          const at = t0 + share * span;
          const p =
            [...timeline].reverse().find((q) => new Date(q.at).getTime() <= at) ?? timeline[0]!;
          return {
            xShare: share,
            yPx: 220 - 4 - (p.committedKw / yMax) * (220 - 12),
            lines: [
              time(p.at),
              `${kw(p.committedKw)} kW committed`,
              `${count(p.households)} households`,
            ],
          };
        }}
      >
        {(y) => {
          const line = timeline
            .map((p, i) =>
              i === 0 ? `M0,${y(p.committedKw)}` : `H${xs(p.at)} V${y(p.committedKw)}`,
            )
            .join(' ');
          return (
            <>
              <path d={`${line} H${W} V${y(0)} H0 Z`} fill={withAlpha(c.committed, 0.12)} />
              <path
                d={`${line} H${W}`}
                fill="none"
                stroke={c.committed}
                strokeWidth={2.5}
                {...nonScaling}
              />
              <line
                x1={0}
                x2={W}
                y1={y(targetKw)}
                y2={y(targetKw)}
                stroke={c.target}
                strokeWidth={2}
                strokeDasharray="6 5"
                {...nonScaling}
              />
            </>
          );
        }}
      </Plot>
    </Stack>
  );
}
