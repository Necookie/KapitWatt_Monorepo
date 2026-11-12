import { Skeleton, Stack } from '@kapitwatt/ui';
import { View } from 'react-native';

/** Skeleton for a list of label-and-value rows (rankings, comparisons, tables). */
export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Stack gap={3}>
      {Array.from({ length: rows }, (_, i) => (
        <Stack key={i} direction="row" align="center" gap={3}>
          <Skeleton width={[140, 110, 160, 120, 130][i % 5]} height={10} />
          <View style={{ flex: 1 }}>
            <Skeleton height={6} radius="full" />
          </View>
          <Skeleton width={40} height={10} />
        </Stack>
      ))}
    </Stack>
  );
}
