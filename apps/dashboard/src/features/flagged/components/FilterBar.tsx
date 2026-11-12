import type { ReadingFlag } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { ChoiceChip } from '@/components/ChoiceChip';
import { FLAG_LABEL } from '../utils/checks';
import { waited } from '../utils/waited';

/** How many are waiting, the oldest wait, and a chip per failed check to filter the queue. */
export function FilterBar({
  total,
  oldest,
  counts,
  filter,
  onFilter,
}: {
  total: number;
  oldest: string | null;
  counts: Map<ReadingFlag, number>;
  filter: ReadingFlag | 'all';
  onFilter: (filter: ReadingFlag | 'all') => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: t.space[2],
      }}
    >
      <Text variant="titleMedium">{total} waiting</Text>
      {oldest ? (
        <Text variant="bodyMedium" color="onSurfaceVariant" style={{ marginRight: t.space[3] }}>
          · oldest {waited(oldest)}
        </Text>
      ) : null}
      <ChoiceChip label="All" selected={filter === 'all'} onPress={() => onFilter('all')} />
      {[...counts].map(([flag, n]) => (
        <ChoiceChip
          key={flag}
          label={`${FLAG_LABEL[flag]} ${n}`}
          selected={filter === flag}
          onPress={() => onFilter(flag)}
        />
      ))}
    </View>
  );
}
