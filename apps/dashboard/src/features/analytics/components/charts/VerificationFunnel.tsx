import { useTheme } from '@kapitwatt/hooks';
import type { AlertAnalytics } from '@kapitwatt/shared';
import { Chip, Stack, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { count, percent } from '@/utils/format';
import { useChartColors } from '../../hooks/useChartColors';
import { STAGES } from '../../utils/stages';
import { ChartLegend } from '../ChartLegend';
import { Empty } from '../Empty';
import { motion } from '@/styles/motion';

/** Households at each verification stage, smart meter and photo stacked, with step conversion. */
export function VerificationFunnel({
  funnel,
  settled,
}: {
  funnel: AlertAnalytics['funnel'];
  settled: boolean;
}) {
  const c = useChartColors();
  const t = useTheme();
  const total = (funnel[0]?.ami ?? 0) + (funnel[0]?.photo ?? 0);
  if (total === 0) return <Empty>No commitments yet.</Empty>;
  return (
    <Stack gap={4}>
      <ChartLegend
        items={[
          { color: c.ami, label: 'Smart meter' },
          { color: c.photo, label: 'Meter photo' },
        ]}
      />
      {funnel.map((row, i) => {
        const n = row.ami + row.photo;
        const prev = i === 0 ? n : funnel[i - 1]!.ami + funnel[i - 1]!.photo;
        const pending = row.stage === 'verified' && !settled;
        return (
          <View key={row.stage} style={{ gap: 6 }}>
            <Stack direction="row" justify="space-between" align="flex-end" gap={3}>
              <View style={{ flexShrink: 1 }}>
                <Text variant="titleSmall">{STAGES[row.stage].label}</Text>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  {STAGES[row.stage].hint}
                </Text>
              </View>
              {pending ? (
                <Chip label="After settlement" tone="neutral" />
              ) : (
                <Stack direction="row" align="center" gap={2}>
                  {i > 0 && prev > n ? <Chip label={`−${count(prev - n)}`} tone="neutral" /> : null}
                  <Text variant="dataSmall">{count(n)}</Text>
                  <Text variant="labelMedium" color="onSurfaceVariant">
                    {percent(n, total)}
                  </Text>
                </Stack>
              )}
            </Stack>
            <View
              style={{
                flexDirection: 'row',
                height: 12,
                borderRadius: t.radius.full,
                overflow: 'hidden',
                backgroundColor: c.track,
              }}
            >
              {pending ? null : (
                // Grows from the left on first show (a settled event's shares do not change).
                <View style={[{ flex: 1, flexDirection: 'row' }, motion.growX]}>
                  <View style={{ width: `${(row.ami / total) * 100}%`, backgroundColor: c.ami }} />
                  <View
                    style={{
                      width: `${(row.photo / total) * 100}%`,
                      backgroundColor: c.photo,
                      marginLeft: row.ami > 0 ? 2 : 0,
                    }}
                  />
                </View>
              )}
            </View>
          </View>
        );
      })}
    </Stack>
  );
}
