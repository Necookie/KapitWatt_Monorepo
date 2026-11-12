import { useTheme } from '@kapitwatt/hooks';
import type { AlertHistoryItem } from '@kapitwatt/shared';
import { Stack, Text } from '@kapitwatt/ui';
import { Pressable, View } from 'react-native';
import { dayAndClock, kw, percent } from '@/utils/format';
import { useChartColors } from '../../hooks/useChartColors';
import { niceMax, ticks } from '../../utils/plot';
import { ChartLegend } from '../ChartLegend';
import { Empty } from '../Empty';

/** Recent alerts as grouped columns: committed and settled delivered, with each target marked. */
export function AlertHistoryBars({
  alerts,
  selected,
  onSelect,
}: {
  alerts: AlertHistoryItem[];
  selected?: string;
  onSelect: (alertId: string) => void;
}) {
  const c = useChartColors();
  const t = useTheme();
  if (alerts.length === 0) return <Empty>No alerts yet.</Empty>;
  const ordered = [...alerts].reverse();
  const max = niceMax(
    Math.max(...ordered.map((a) => Math.max(a.targetKw, a.committedKw, a.deliveredKw ?? 0))) * 1.05,
  );
  const H = 200;
  return (
    <Stack gap={3}>
      <ChartLegend
        items={[
          { color: c.committed, label: 'Committed' },
          { color: c.delivered, label: 'Delivered (settled)' },
          { color: c.target, label: 'Target', dashed: true },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ width: 52, height: H }}>
          {ticks(max).map((v) => (
            <Text
              key={v}
              variant="labelSmall"
              color="onSurfaceVariant"
              style={{ position: 'absolute', right: 0, top: H - (v / max) * H - 8 }}
            >
              {kw(v)}
            </Text>
          ))}
        </View>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'flex-end',
            height: H,
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: c.grid,
          }}
        >
          {ordered.map((a) => {
            const active = a.alertId === selected;
            return (
              <Pressable
                key={a.alertId}
                onPress={() => onSelect(a.alertId)}
                accessibilityRole="button"
                accessibilityLabel={`Alert of ${dayAndClock(a.windowStart)}: committed ${kw(a.committedKw)} kW, delivered ${a.deliveredKw === null ? 'not settled' : `${kw(a.deliveredKw)} kW`}`}
                style={{
                  flex: 1,
                  maxWidth: 120,
                  height: H,
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  gap: 4,
                  paddingHorizontal: 6,
                  borderRadius: t.radius.sm,
                  backgroundColor: active ? t.color.primaryContainer : 'transparent',
                }}
              >
                <View
                  style={{
                    width: '38%',
                    height: `${(a.committedKw / max) * 100}%`,
                    backgroundColor: c.committed,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
                <View
                  style={{
                    width: '38%',
                    height: `${((a.deliveredKw ?? 0) / max) * 100}%`,
                    backgroundColor: c.delivered,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: 4,
                    right: 4,
                    bottom: `${(a.targetKw / max) * 100}%`,
                    borderTopWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: c.target,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginLeft: 60 }}>
        {ordered.map((a) => (
          <View key={a.alertId} style={{ flex: 1, maxWidth: 120, alignItems: 'center' }}>
            <Text
              variant="labelSmall"
              color={a.alertId === selected ? 'primary' : 'onSurfaceVariant'}
              align="center"
            >
              {dayAndClock(a.windowStart)}
            </Text>
            <Text variant="labelSmall" color="onSurfaceVariant" align="center">
              {a.deliveredKw === null ? 'Not settled' : percent(a.deliveredKw, a.targetKw)}
            </Text>
          </View>
        ))}
      </View>
    </Stack>
  );
}
