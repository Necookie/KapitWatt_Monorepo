import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';

export function Legend({ color, label }: { color: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[1] }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text variant="bodySmall" color="onSurfaceVariant">
        {label}
      </Text>
    </View>
  );
}
