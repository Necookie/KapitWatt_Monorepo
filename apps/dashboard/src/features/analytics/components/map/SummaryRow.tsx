import type { BarangayTotals } from '@kapitwatt/shared';
import { Stack, Text } from '@kapitwatt/ui';
import { percent } from '@/utils/format';

/** One barangay and its share of target, in the map's closest and furthest lists. */
export function SummaryRow({ b }: { b: BarangayTotals }) {
  return (
    <Stack direction="row" justify="space-between" gap={3}>
      <Text variant="bodyMedium" numberOfLines={1} style={{ flexShrink: 1 }}>
        {b.name}
        <Text variant="bodySmall" color="onSurfaceVariant">
          {' '}
          · {b.municipality}
        </Text>
      </Text>
      <Text variant="labelLarge">{percent(b.deliveredKw, b.targetKw)}</Text>
    </Stack>
  );
}
