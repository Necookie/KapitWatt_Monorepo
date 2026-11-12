import type { BarangayWithCount } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { count } from '@/utils/format';
import { ChoiceChip } from '@/components/ChoiceChip';
import { TownCard } from './TownCard';

/** Target areas as town cards; "All pilot areas" picks or clears everything. */
export function AreaPicker({
  byTown,
  selected,
  onToggle,
  onAll,
  loading,
}: {
  byTown: [string, BarangayWithCount[]][];
  selected: Set<string>;
  onToggle: (ids: string[], on: boolean) => void;
  onAll: (on: boolean) => void;
  loading: boolean;
}) {
  const t = useTheme();
  const total = byTown.reduce((n, [, list]) => n + list.length, 0);
  const everything = total > 0 && selected.size === total;
  if (total === 0) {
    return (
      <Text variant="bodyMedium" color="onSurfaceVariant">
        {loading ? 'Loading the pilot barangays.' : 'No barangays returned by the API.'}
      </Text>
    );
  }
  return (
    <View style={{ gap: t.space[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
        <ChoiceChip
          label="All pilot areas"
          selected={everything}
          onPress={() => onAll(!everything)}
        />
        <Text variant="bodySmall" color="onSurfaceVariant">
          {count(selected.size)} of {count(total)} barangays
        </Text>
      </View>
      {/* One row per town: no leftover cards, and every barangay is visible at once. */}
      <View style={{ gap: t.space[2] }}>
        {byTown.map(([town, list]) => (
          <TownCard key={town} town={town} list={list} selected={selected} onToggle={onToggle} />
        ))}
      </View>
    </View>
  );
}
