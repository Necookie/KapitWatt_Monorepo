import { themes } from '@kapitwatt/styles';
import { space, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { formatWindow } from '@/utils/format';

const c = themes.light.color;

/** The commit screen's band: the question, and that the street below dims with the answer. */
export function CommitBand(props: { windowStart: string; windowEnd: string }) {
  return (
    <View style={styles.band}>
      <Text variant="headlineSmall" accessibilityRole="header" style={{ color: c.onBrand }}>
        {`How much can you cut, ${formatWindow(props.windowStart, props.windowEnd)}?`}
      </Text>
      <Text variant="bodyMedium" style={{ color: withAlpha(c.onBrand, 0.78) }}>
        Your street dims as you choose.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ band: { gap: space[1] } });
