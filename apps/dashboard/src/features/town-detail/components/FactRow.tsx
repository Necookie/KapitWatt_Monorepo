import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';

/** A label and its figure on one line, the figure right-aligned in tabular digits. */
export function FactRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.space[3] }}>
      <Text variant="bodyMedium" color="onSurfaceVariant" style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <Text
        variant="bodyMedium"
        color={muted ? 'onSurfaceVariant' : 'onSurface'}
        style={{ fontVariant: ['tabular-nums'], textAlign: 'right', flexShrink: 1 }}
      >
        {value}
      </Text>
    </View>
  );
}
