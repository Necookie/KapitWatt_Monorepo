import { useCountdown } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { serverOffsetMs } from '@/utils/server-time';

/** Counts down to `at` on the server clock (the design system's countdown, given the server offset). */
export function Countdown(props: { label: string; at: string }) {
  const left = useCountdown(props.at, serverOffsetMs());
  return (
    <View>
      <Text color="onSurfaceVariant">{props.label}</Text>
      <Text variant="dataLarge">{left.label}</Text>
    </View>
  );
}
