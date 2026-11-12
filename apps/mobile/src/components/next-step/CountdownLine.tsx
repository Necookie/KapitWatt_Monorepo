import { useCountdown } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { StyleSheet } from 'react-native';
import { serverOffsetMs } from '@/utils/server-time';

/** "Peak window starts in 42:10", on the server clock. */
export function CountdownLine(props: { label: string; at: string; color: string }) {
  const left = useCountdown(props.at, serverOffsetMs());
  return (
    <Text variant="titleSmall" style={[styles.tabular, { color: props.color }]}>
      {`${props.label} ${left.label}`}
    </Text>
  );
}

const styles = StyleSheet.create({ tabular: { fontVariant: ['tabular-nums'] } });
