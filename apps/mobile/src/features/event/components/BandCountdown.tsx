import { useCountdown } from '@kapitwatt/hooks';
import { themes } from '@kapitwatt/styles';
import { fontFamily, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { serverOffsetMs } from '@/utils/server-time';

const c = themes.light.color;

/** The countdown in the event's band: what it runs to, then the time left, large and white. */
export function BandCountdown(props: { label: string; at: string }) {
  const left = useCountdown(props.at, serverOffsetMs());
  return (
    <View>
      <Text variant="bodyMedium" style={{ color: withAlpha(c.onBrand, 0.78) }}>
        {props.label}
      </Text>
      <Text accessibilityRole="timer" style={styles.figure}>
        {left.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  figure: {
    fontFamily: fontFamily.semibold,
    fontSize: 44,
    lineHeight: 52,
    color: c.onBrand,
    fontVariant: ['tabular-nums'],
  },
});
