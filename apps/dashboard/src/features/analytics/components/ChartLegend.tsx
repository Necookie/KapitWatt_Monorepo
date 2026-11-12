import { Stack, Text } from '@kapitwatt/ui';
import { View } from 'react-native';

/** A legend entry: swatch (or a dashed line) and a name. */
export function ChartLegend({
  items,
}: {
  items: { color: string; label: string; dashed?: boolean }[];
}) {
  return (
    <Stack direction="row" gap={4} wrap>
      {items.map((item) => (
        <Stack key={item.label} direction="row" align="center" gap={2}>
          {item.dashed ? (
            <View
              style={{
                width: 16,
                borderTopWidth: 2,
                borderStyle: 'dashed',
                borderColor: item.color,
              }}
            />
          ) : (
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color }} />
          )}
          <Text variant="labelMedium" color="onSurfaceVariant">
            {item.label}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}
