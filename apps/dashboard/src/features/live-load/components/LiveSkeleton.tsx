import { useTheme } from '@kapitwatt/hooks';
import { Skeleton } from '@kapitwatt/ui';
import { View } from 'react-native';
import { Split } from '@/components/Split';

/**
 * The live bento's shape while the alert and its totals first load, so the page never shows the
 * calm "no alert" state or zeros before it knows.
 */
export function LiveSkeleton({
  heroBeside,
  chartsBeside,
}: {
  heroBeside: boolean;
  chartsBeside: boolean;
}) {
  const t = useTheme();
  return (
    <View accessibilityLabel="Loading the live load" style={{ gap: t.space[4] }}>
      <Split wide={heroBeside}>
        <Skeleton height={heroBeside ? 361 : 420} radius="lg" />
        <View style={{ gap: t.space[4] }}>
          <Skeleton height={heroBeside ? 170 : 140} radius="lg" />
          <View style={{ flexDirection: 'row', gap: t.space[4] }}>
            <Skeleton height={heroBeside ? 175 : 140} radius="lg" style={{ flex: 1 }} />
            <Skeleton height={heroBeside ? 175 : 140} radius="lg" style={{ flex: 1 }} />
          </View>
        </View>
      </Split>
      <Split wide={chartsBeside} ratio={[7, 5]}>
        <Skeleton height={chartsBeside ? 456 : 360} radius="lg" />
        <Skeleton height={chartsBeside ? 456 : 360} radius="lg" />
      </Split>
    </View>
  );
}
