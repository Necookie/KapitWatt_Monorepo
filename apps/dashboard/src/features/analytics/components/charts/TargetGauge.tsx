import { Chip, Stack, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { kw, percent } from '@/utils/format';
import { useChartColors } from '../../hooks/useChartColors';
import { svgFont } from '../../utils/plot';
import { domDraw } from '@/styles/motion';

/** Delivered as a share of target on a half-circle gauge running to 125%, with the 100% mark. */
export function TargetGauge({
  deliveredKw,
  targetKw,
  settled,
}: {
  deliveredKw: number;
  targetKw: number;
  settled: boolean;
}) {
  const c = useChartColors();
  const share = targetKw > 0 ? deliveredKw / targetKw : 0;
  const scale = 1.25;
  const r = 80;
  const cx = 100;
  const cy = 96;
  const point = (f: number) => {
    const a = Math.PI * (1 - Math.min(f, scale) / scale);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = point(from);
    const [x2, y2] = point(to);
    return `M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`;
  };
  const [tx1, ty1] = [
    cx + (r - 14) * Math.cos(Math.PI * (1 - 1 / scale)),
    cy - (r - 14) * Math.sin(Math.PI * (1 - 1 / scale)),
  ];
  const [tx2, ty2] = [
    cx + (r + 14) * Math.cos(Math.PI * (1 - 1 / scale)),
    cy - (r + 14) * Math.sin(Math.PI * (1 - 1 / scale)),
  ];
  const hit = share >= 1;
  return (
    <Stack align="center" gap={1}>
      <svg
        viewBox="0 0 200 116"
        width="100%"
        style={{ maxWidth: 320 }}
        role="img"
        aria-label={`Delivered ${percent(deliveredKw, targetKw)} of target`}
      >
        <path
          d={arc(0, scale)}
          fill="none"
          stroke={c.track}
          strokeWidth={18}
          strokeLinecap="round"
        />
        {share > 0 ? (
          <path
            d={arc(0, share)}
            pathLength={1}
            style={domDraw}
            fill="none"
            stroke={hit ? c.delivered : c.committed}
            strokeWidth={18}
            strokeLinecap="round"
          />
        ) : null}
        <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={c.target} strokeWidth={3} />
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          fontFamily={svgFont}
          fontSize={30}
          fill={c.ink}
        >
          {Math.round(share * 100)}%
        </text>
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          fontFamily={svgFont}
          fontSize={11}
          fill={c.muted}
        >
          of target
        </text>
      </svg>
      <Text variant="bodyMedium" color="onSurfaceVariant" align="center">
        {kw(deliveredKw)} of {kw(targetKw)} kW {settled ? 'verified' : 'so far'}
      </Text>
      <View style={{ alignSelf: 'center' }}>
        <Chip
          label={hit ? 'Target reached' : `${kw(Math.max(0, targetKw - deliveredKw))} kW short`}
          tone={hit ? 'relief' : 'neutral'}
        />
      </View>
    </Stack>
  );
}
