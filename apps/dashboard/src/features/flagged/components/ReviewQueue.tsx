import type { FlaggedReading } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { View } from 'react-native';
import { QueueCard } from './QueueCard';

/** Readings waiting for a person, newest first (the API's order); the selected one is reviewed. */
export function ReviewQueue({
  rows,
  selectedId,
  onSelect,
}: {
  rows: FlaggedReading[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const t = useTheme();
  return (
    <View accessibilityRole="list" style={{ gap: t.space[2] }}>
      {rows.map((r) => (
        <QueueCard
          key={r.id}
          reading={r}
          selected={r.id === selectedId}
          onPress={() => onSelect(r.id)}
        />
      ))}
    </View>
  );
}
