import { themes } from '@kapitwatt/styles';
import { Mascot, Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { radius, space } from '@/styles/theme';

const c = themes.light.color;

/** No alert right now: the calm mascot, so Home is never empty. */
export function QuietCard() {
  return (
    <View style={styles.quiet}>
      <View
        style={styles.quietBadge}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.mascotSmall}>
          <Mascot pose="neutral" height={65} />
        </View>
      </View>
      <View style={styles.flex}>
        <Text variant="titleMedium">No grid alert right now</Text>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          We will tell you when the grid needs help. Pull down to check again.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  quiet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
  },
  quietBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEDE8',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  mascotSmall: { marginBottom: -5 },
});
