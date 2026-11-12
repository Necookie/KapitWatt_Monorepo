import { Stack, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { useShareShade } from '../hooks/useShareShade';

/** Legend for the share-of-target scale. */
export function ShareScale() {
  const shade = useShareShade();
  return (
    <Stack direction="row" align="center" gap={2}>
      <Text variant="labelSmall" color="onSurfaceVariant">
        50% or less
      </Text>
      <View
        style={{ flexDirection: 'row', width: 160, height: 8, borderRadius: 4, overflow: 'hidden' }}
      >
        {[0.5, 0.625, 0.75, 0.875, 0.99, 1].map((s) => (
          <View key={s} style={{ flex: 1, backgroundColor: shade(s) }} />
        ))}
      </View>
      <Text variant="labelSmall" color="onSurfaceVariant">
        100%+ of target
      </Text>
    </Stack>
  );
}
