import type { BarangayTotals } from '@kapitwatt/shared';
import { ProgressBar, Stack, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { percent } from '@/utils/format';
import { shareOf } from '../../utils/share';
import { Empty } from '../Empty';

/** Every barangay ranked by share of target on the design system's progress bar, target marked. */
export function BarangayRanking({ barangays }: { barangays: BarangayTotals[] }) {
  if (barangays.length === 0) return <Empty>No barangays targeted.</Empty>;
  const rows = [...barangays].sort((a, b) => shareOf(b) - shareOf(a));
  return (
    <Stack gap={2}>
      {rows.map((b, i) => (
        <Stack key={b.barangayId} direction="row" align="center" gap={3}>
          <Text
            variant="labelMedium"
            color="onSurfaceVariant"
            style={{ width: 20, textAlign: 'right' }}
          >
            {i + 1}
          </Text>
          <Text variant="labelLarge" numberOfLines={1} style={{ width: 210 }}>
            {b.name}
            <Text variant="labelMedium" color="onSurfaceVariant">
              {' '}
              · {b.municipality}
            </Text>
          </Text>
          <View style={{ flex: 1 }}>
            <ProgressBar
              value={Math.min(shareOf(b) / 1.25, 1)}
              target={1 / 1.25}
              tone={b.targetHit ? 'relief' : 'primary'}
              accessibilityLabel={`${b.name} ${percent(b.deliveredKw, b.targetKw)} of target`}
            />
          </View>
          <Text variant="labelLarge" style={{ width: 48, textAlign: 'right' }}>
            {percent(b.deliveredKw, b.targetKw)}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}
