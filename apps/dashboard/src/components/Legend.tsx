import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';

/** Swatches for a chart; `outline` draws a dashed ring for an assumption. */
export function Legend({
  items,
}: {
  items: { color: string; label: string; outline?: boolean }[];
}) {
  const t = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: t.space[4], rowGap: t.space[1] }}
    >
      {items.map((i) => (
        <View key={i.label} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[1] }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: i.outline ? 'transparent' : i.color,
              borderWidth: i.outline ? 1.5 : 0,
              borderStyle: 'dashed',
              borderColor: i.color,
            }}
          />
          <Text variant="bodySmall" color="onSurfaceVariant">
            {i.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
