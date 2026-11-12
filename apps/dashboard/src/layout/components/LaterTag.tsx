import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';

export function LaterTag() {
  const t = useTheme();
  return (
    <View
      accessibilityLabel="Later priority"
      style={{
        paddingHorizontal: t.space[2],
        paddingVertical: 1,
        borderRadius: t.radius.xs,
        backgroundColor: t.color.surfaceContainerHighest,
      }}
    >
      <Text variant="labelSmall" color="onSurfaceVariant">
        P1
      </Text>
    </View>
  );
}
