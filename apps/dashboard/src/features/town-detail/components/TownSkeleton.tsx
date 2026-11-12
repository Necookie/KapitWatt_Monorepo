import { useTheme } from '@kapitwatt/hooks';
import { Skeleton } from '@kapitwatt/ui';
import { View } from 'react-native';
import { Split } from '@/components/Split';

/** The town page's shape while the alert and its totals first load. */
export function TownSkeleton({ wide }: { wide: boolean }) {
  const t = useTheme();
  return (
    <View accessibilityLabel="Loading the town" style={{ gap: t.space[4] }}>
      <Split wide={wide}>
        <Skeleton height={wide ? 300 : 340} radius="lg" />
        <View style={{ gap: t.space[3] }}>
          <Skeleton height={wide ? 170 : 150} radius="lg" />
          <Skeleton height={wide ? 118 : 110} radius="lg" />
        </View>
      </Split>
      <Skeleton height={wide ? 300 : 620} radius="lg" />
    </View>
  );
}
