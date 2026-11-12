import { useTheme } from '@kapitwatt/hooks';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { motion, transition } from '@/styles/motion';
import { CHART, GUTTER, type Column } from './columns';

export function WaterfallBar({
  col,
  scale,
  compact,
}: {
  col: Column;
  scale: number;
  compact: boolean;
}) {
  const t = useTheme();
  const px = (kwValue: number) => (kwValue / scale) * CHART;
  const total = col.segs.reduce((s, x) => s + x.value, 0);
  const bottom = px(col.from);
  const height = Math.max(px(total), total > 0 ? 2 : 0);
  return (
    <View style={{ flex: 1, minWidth: 0, gap: t.space[2] }}>
      <View style={{ height: CHART, paddingHorizontal: GUTTER / 2 }}>
        {col.connectAt !== undefined ? (
          <View
            style={{
              position: 'absolute',
              left: -GUTTER / 2,
              width: GUTTER,
              bottom: px(col.connectAt),
              height: 0,
              borderTopWidth: 1,
              borderStyle: 'dashed',
              borderColor: t.color.outline,
            }}
          />
        ) : null}
        <View
          style={[
            {
              position: 'absolute',
              left: GUTTER / 2,
              right: GUTTER / 2,
              bottom: bottom + height + t.space[1],
              alignItems: 'center',
            },
            transition('bottom'),
            motion.fadeIn,
          ]}
        >
          {/* A surface behind the figure so the target line never runs through it. */}
          <Text
            variant="titleSmall"
            style={{
              fontVariant: ['tabular-nums'],
              paddingHorizontal: t.space[1],
              backgroundColor: t.color.surfaceContainerLowest,
            }}
          >
            {col.text}
          </Text>
        </View>
        {/* Grows from its baseline on first show; a new total glides there. */}
        <View
          style={[
            motion.growY,
            transition('bottom, height'),
            {
              position: 'absolute',
              left: GUTTER / 2,
              right: GUTTER / 2,
              bottom,
              height,
              flexDirection: 'column-reverse',
              borderRadius: t.radius.xs,
              overflow: 'hidden',
              // An assumption: one dashed outline round the whole bar.
              ...(col.projected
                ? {
                    borderWidth: t.borderWidth.strong,
                    borderStyle: 'dashed' as const,
                    borderColor: t.color.outline,
                  }
                : null),
            },
          ]}
        >
          {col.segs.map((s, i) => (
            <View
              key={i}
              style={{
                height: total > 0 ? `${(s.value / total) * 100}%` : 0,
                backgroundColor: col.projected ? withAlpha(s.color, 0.22) : s.color,
              }}
            />
          ))}
        </View>
      </View>
      <View style={{ alignItems: 'center', paddingHorizontal: t.space[1] }}>
        <Text variant={compact ? 'labelSmall' : 'labelLarge'} style={{ textAlign: 'center' }}>
          {col.label}
        </Text>
        {col.note && !compact ? (
          <Text variant="bodySmall" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
            {col.note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
