import { REWARD, type BarangayTotals } from '@kapitwatt/shared';
import { Chip, Divider, ProgressBar, Stack, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { count, fraction, kw, percent } from '@/utils/format';
import { shareOf } from '../../utils/share';

/** The selected barangay's numbers beside the map. */
export function BarangayDetail({ b, rank, of }: { b: BarangayTotals; rank: number; of: number }) {
  const share = shareOf(b);
  const rows: [string, string][] = [
    ['Target', `${kw(b.targetKw)} kW`],
    ['Committed', `${kw(b.committedKw)} kW (${percent(b.committedKw, b.targetKw)})`],
    ['Delivered', `${kw(b.deliveredKw)} kW`],
    ['Lost after committing', `${kw(Math.max(0, b.committedKw - b.deliveredKw))} kW`],
    ...(b.households !== undefined
      ? [['Opted-in households', count(b.households)] as [string, string]]
      : []),
    ['Rank', `${rank} of ${of}`],
  ];
  return (
    <Stack gap={3}>
      <View>
        <Text variant="titleLarge">{b.name}</Text>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          {b.municipality}, Laguna
        </Text>
      </View>
      <Stack direction="row" gap={2} wrap>
        <Chip
          label={b.targetHit ? 'Target reached' : `${percent(b.deliveredKw, b.targetKw)} of target`}
          tone={b.targetHit ? 'relief' : 'neutral'}
        />
      </Stack>
      <ProgressBar
        value={Math.min(share / 1.25, 1)}
        target={1 / 1.25}
        tone={b.targetHit ? 'relief' : 'primary'}
        size="thick"
        accessibilityLabel={`${b.name} delivered ${percent(b.deliveredKw, b.targetKw)} of target`}
      />
      <Divider />
      {rows.map(([label, value]) => (
        <Stack key={label} direction="row" justify="space-between" gap={3}>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {label}
          </Text>
          <Text variant="labelLarge">{value}</Text>
        </Stack>
      ))}
      <Text variant="bodySmall" color="onSurfaceVariant">
        {b.targetHit
          ? `Every household here with a verified cut earns the ${fraction(REWARD.barangayBonusRate)} barangay bonus.`
          : 'Short of target: no barangay bonus this event.'}
      </Text>
    </Stack>
  );
}
