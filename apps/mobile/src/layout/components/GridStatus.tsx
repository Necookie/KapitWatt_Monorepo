import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useActiveAlert } from '@/api/queries';
import { AlertBadge } from '@/components/AlertBadge';
import { formatClock } from '@/utils/format';

const c = themes.light.color;
const ON_SOFT = withAlpha(c.onBrand, 0.78);

/**
 * The grid's state in the night band, on every tab: "No grid alert", or the NGCP level (in words,
 * with the alert icon) and when the window ends. During an alert it opens the event screen.
 * Nothing while the alert is loading or failed to load (Home says so in full).
 */
export function GridStatus() {
  const alert = useActiveAlert();
  if (alert.isPending || alert.isError) return null;
  const view = alert.data;
  if (!view) {
    return (
      <View style={styles.quiet}>
        <View style={styles.dot} />
        <Text variant="labelMedium" style={{ color: ON_SOFT }}>
          No grid alert
        </Text>
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${view.alert.level === 'red' ? 'Red' : 'Yellow'} alert until ${formatClock(view.alert.windowEnd)}. Open the event`}
      onPress={() =>
        router.push({ pathname: '/alert/[alertId]', params: { alertId: view.alert.id } })
      }
      style={styles.alert}
    >
      <AlertBadge level={view.alert.level} />
      <Text variant="labelMedium" style={{ color: ON_SOFT }}>
        {`until ${formatClock(view.alert.windowEnd)}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  quiet: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: withAlpha(c.onBrand, 0.32),
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.primaryContainer },
  alert: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 },
});
