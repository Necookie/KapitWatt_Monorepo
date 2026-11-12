import { Stack, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { percent } from '@/utils/format';
import { useChartColors } from '../../hooks/useChartColors';
import { svgFont } from '../../utils/plot';
import { Empty } from '../Empty';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/** A donut with a centre figure and a legend that states every value and share. */
export function Donut({
  segments,
  center,
  centerCaption,
  format,
  empty = 'Nothing to show yet.',
}: {
  segments: DonutSegment[];
  center: string;
  centerCaption: string;
  format: (v: number) => string;
  /** What to say when every segment is zero. */
  empty?: string;
}) {
  const c = useChartColors();
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return <Empty icon="pending">{empty}</Empty>;
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const gap = shown.length > 1 ? 3 : 0;
  let offset = 0;
  return (
    <Stack direction="row" align="center" gap={6} wrap>
      <svg
        viewBox="0 0 150 150"
        width={168}
        height={168}
        role="img"
        aria-label={shown.map((s) => `${s.label} ${percent(s.value, total)}`).join(', ')}
      >
        <circle cx={75} cy={75} r={r} fill="none" stroke={c.track} strokeWidth={20} />
        {shown.map((s) => {
          const length = (s.value / total) * circumference;
          const dash = Math.max(length - gap, 0.5);
          const el = (
            <circle
              key={s.label}
              cx={75}
              cy={75}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={20}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 75 75)"
            />
          );
          offset += length;
          return el;
        })}
        <text x={75} y={74} textAnchor="middle" fontFamily={svgFont} fontSize={20} fill={c.ink}>
          {center}
        </text>
        <text x={75} y={92} textAnchor="middle" fontFamily={svgFont} fontSize={10} fill={c.muted}>
          {centerCaption}
        </text>
      </svg>
      <Stack gap={2} style={{ flexGrow: 1, minWidth: 180 }}>
        {shown.map((s) => (
          <Stack key={s.label} direction="row" align="center" justify="space-between" gap={4}>
            <Stack direction="row" align="center" gap={2}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
              <Text variant="bodyMedium">{s.label}</Text>
            </Stack>
            <Text variant="labelLarge" color="onSurfaceVariant">
              {format(s.value)} · {percent(s.value, total)}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
