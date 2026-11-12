import type { AlertAnalytics } from '@kapitwatt/shared';
import { Stack, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { count, fraction, kw, php } from '@/utils/format';
import { useChartColors } from '../../hooks/useChartColors';
import { barScale, motion } from '@/styles/motion';

/** Smart meter vs photo, side by side: the case for smart meters in numbers. */
export function PathComparison({ paths }: { paths: AlertAnalytics['paths'] }) {
  const c = useChartColors();
  const rows: { path: 'ami' | 'photo'; label: string; color: string }[] = [
    { path: 'ami', label: 'Smart meter', color: c.ami },
    { path: 'photo', label: 'Meter photo', color: c.photo },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {rows.map(({ path, label, color }) => {
        const p = paths.find((x) => x.path === path);
        const rate =
          p && p.committedHouseholds > 0 ? p.verifiedHouseholds / p.committedHouseholds : 0;
        const perKwh = p && p.verifiedKwh > 0 ? p.paidPhp / p.verifiedKwh : null;
        return (
          <View key={path} style={{ flexGrow: 1, flexBasis: 260, gap: 10 }}>
            <Stack direction="row" align="center" gap={2}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
              <Text variant="titleSmall">{label}</Text>
            </Stack>
            <Stack direction="row" justify="space-between">
              <Text variant="bodyMedium" color="onSurfaceVariant">
                Verified
              </Text>
              <Text variant="labelLarge">
                {count(p?.verifiedHouseholds ?? 0)} of {count(p?.committedHouseholds ?? 0)} ·{' '}
                {fraction(rate)}
              </Text>
            </Stack>
            <View
              accessibilityLabel={`${label} verified ${fraction(rate)}`}
              style={{ height: 6, borderRadius: 3, backgroundColor: c.track, overflow: 'hidden' }}
            >
              <View
                style={[motion.growX, barScale(rate), { height: '100%', backgroundColor: color }]}
              />
            </View>
            <Stack direction="row" justify="space-between">
              <Text variant="bodyMedium" color="onSurfaceVariant">
                Verified energy
              </Text>
              <Text variant="labelLarge">{kw(p?.verifiedKwh ?? 0)} kWh</Text>
            </Stack>
            <Stack direction="row" justify="space-between">
              <Text variant="bodyMedium" color="onSurfaceVariant">
                Paid
              </Text>
              <Text variant="labelLarge">
                {php(p?.paidPhp ?? 0)}
                {perKwh !== null ? ` · ${php(perKwh)}/kWh` : ''}
              </Text>
            </Stack>
          </View>
        );
      })}
    </View>
  );
}
