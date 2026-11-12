import type { AlertLevel } from '@kapitwatt/shared';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, text } from '@/theme';

export function AlertBadge(props: { level: AlertLevel }) {
  const red = props.level === 'red';
  return (
    <View style={[styles.badge, { backgroundColor: red ? colors.red : colors.yellow }]}>
      <Text style={[styles.label, { color: red ? colors.onDark : colors.navy }]}>
        {red ? 'RED ALERT' : 'YELLOW ALERT'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  label: { ...text.caption, fontWeight: '700', letterSpacing: 1 },
});
