import { useTheme } from '@kapitwatt/hooks';
import { Skeleton, Stack } from '@kapitwatt/ui';
import { View } from 'react-native';

/** Plot-shaped skeleton: a legend line, then columns of varied height on a baseline. */
export function PlotSkeleton({ height = 200 }: { height?: number }) {
  const t = useTheme();
  const bars = [0.4, 0.62, 0.5, 0.78, 0.58, 0.9, 0.48, 0.7, 0.6, 0.84, 0.66, 0.74];
  return (
    <Stack gap={3}>
      <Skeleton width={200} height={10} />
      <View
        style={{
          height,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 10,
          borderBottomWidth: 1,
          borderBottomColor: t.color.outlineVariant,
        }}
      >
        {bars.map((h, i) => (
          <View key={i} style={{ flex: 1, height: `${h * 100}%` }}>
            <Skeleton height="100%" radius="xs" />
          </View>
        ))}
      </View>
    </Stack>
  );
}
