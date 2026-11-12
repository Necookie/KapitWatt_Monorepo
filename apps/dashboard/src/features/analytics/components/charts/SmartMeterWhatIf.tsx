import type { SimParams } from '@kapitwatt/shared';
import { expectedOutcome } from '@kapitwatt/sim';
import { withAlpha } from '@kapitwatt/tokens';
import { Stack, Text } from '@kapitwatt/ui';
import { count, fraction, kw } from '@/utils/format';
import { useChartColors } from '../../hooks/useChartColors';
import { niceMax, nonScaling, W } from '../../utils/plot';
import { ChartLegend } from '../ChartLegend';
import { Plot } from './Plot';

/** Expected delivered kW as the smart-meter share grows, from the simulator's own forecast. */
export function SmartMeterWhatIf({
  households,
  params,
  targetKw,
}: {
  households: number;
  params: SimParams;
  targetKw: number;
}) {
  const c = useChartColors();
  const shares = Array.from({ length: 21 }, (_, i) => i / 20);
  const series = shares.map(
    (s) => expectedOutcome(households, { ...params, amiShare: s }).deliveredKw,
  );
  const now = expectedOutcome(households, params).deliveredKw;
  const all = series[series.length - 1]!;
  const max = niceMax(Math.max(all, targetKw) * 1.08);
  return (
    <Stack gap={3}>
      <ChartLegend
        items={[
          { color: c.ami, label: 'Expected delivered kW' },
          { color: c.target, label: `Target ${kw(targetKw)} kW`, dashed: true },
        ]}
      />
      <Plot
        height={190}
        yMax={max}
        yFormat={(v) => kw(v)}
        xLabels={[
          { at: 0, text: '0%' },
          { at: params.amiShare, text: `Today ${fraction(params.amiShare)}` },
          { at: 1, text: '100% smart meters' },
        ]}
        label={`At ${fraction(params.amiShare)} smart meters about ${kw(Math.round(now))} kW; at 100%, about ${kw(Math.round(all))} kW.`}
        hover={(share) => {
          const i = Math.round(share * 20);
          return {
            xShare: i / 20,
            yPx: 186 - (series[i]! / max) * 178,
            lines: [
              `${fraction(i / 20)} smart meters`,
              `≈ ${kw(Math.round(series[i]!))} kW delivered`,
            ],
          };
        }}
      >
        {(y) => (
          <>
            <path
              d={`${series.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / 20) * W},${y(v)}`).join(' ')} V${y(0)} H0 Z`}
              fill={withAlpha(c.ami, 0.1)}
            />
            <path
              d={series.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / 20) * W},${y(v)}`).join(' ')}
              fill="none"
              stroke={c.ami}
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
            <line
              x1={params.amiShare * W}
              x2={params.amiShare * W}
              y1={y(max)}
              y2={y(0)}
              stroke={c.baseline}
              strokeWidth={1}
              strokeDasharray="2 4"
              {...nonScaling}
            />
            <ellipse cx={params.amiShare * W} cy={y(now)} rx={5 * (W / 700)} ry={5} fill={c.ami} />
          </>
        )}
      </Plot>
      <Text variant="bodySmall" color="onSurfaceVariant">
        {count(households)} households at {fraction(params.participation)} participation,{' '}
        {fraction(params.followThrough)} follow-through, {fraction(params.photoCompletion)} photo
        completion (simulation assumptions). Every household on a smart meter would deliver about{' '}
        {kw(Math.round(all - now))} kW more: no photos to miss.
      </Text>
    </Stack>
  );
}
