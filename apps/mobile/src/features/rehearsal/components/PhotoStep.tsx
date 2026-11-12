import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { radius, space } from '@kapitwatt/tokens';

const c = themes.light.color;

export function PhotoStep(props: {
  number: number;
  title: string;
  detail: string;
  state: 'done' | 'now' | 'later';
}) {
  const now = props.state === 'now';
  const done = props.state === 'done';
  return (
    <View style={[styles.step, now ? styles.stepNow : styles.stepIdle]}>
      <View
        style={[
          styles.badge,
          { backgroundColor: done ? c.relief : now ? c.primary : c.surfaceContainerHighest },
        ]}
      >
        <Text
          variant="titleMedium"
          style={{ color: done ? c.onRelief : now ? c.onPrimary : c.onSurfaceVariant }}
        >
          {String(props.number)}
        </Text>
      </View>
      <View style={styles.flex}>
        <Text
          variant="titleMedium"
          color={props.state === 'later' ? 'onSurfaceVariant' : 'onSurface'}
        >
          {props.title}
        </Text>
        <Text variant="bodyMedium" color={done ? 'relief' : 'onSurfaceVariant'}>
          {props.detail}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: space[4],
    borderRadius: radius.lg,
  },
  stepNow: { borderWidth: 2, borderColor: c.primary, backgroundColor: c.surfaceContainerLowest },
  stepIdle: {
    borderWidth: 1,
    borderColor: c.outlineVariant,
    backgroundColor: c.surfaceContainerLow,
    margin: 1,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
