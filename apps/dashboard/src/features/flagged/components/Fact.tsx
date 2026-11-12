import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';

export function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 160,
        gap: t.space[0.5],
        padding: t.space[3],
        borderRadius: t.radius.md,
        backgroundColor: t.color.surfaceContainerLow,
      }}
    >
      <Text variant="labelMedium" color="onSurfaceVariant">
        {label}
      </Text>
      <Text variant="titleMedium" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      {note ? (
        <Text variant="bodySmall" color="onSurfaceVariant">
          {note}
        </Text>
      ) : null}
    </View>
  );
}
