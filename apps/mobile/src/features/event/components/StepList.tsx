import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { fontFamily, radius, space } from '@kapitwatt/tokens';
import type { Step, StepState } from '@/utils/event-steps';

const c = themes.light.color;

/** The round marker at the start of each step. */
function Marker(props: { state: StepState }) {
  switch (props.state) {
    case 'done':
      return (
        <View style={[styles.marker, { backgroundColor: c.relief }]}>
          <Icon name="check" size="sm" weight="bold" color="onRelief" />
        </View>
      );
    case 'now':
      return (
        <View style={[styles.marker, styles.ring, { borderColor: c.primary }]}>
          <View style={styles.dot} />
        </View>
      );
    case 'missed':
      return (
        <View style={[styles.marker, styles.ring, { borderColor: c.error }]}>
          <Icon name="close" size="sm" weight="bold" color="error" />
        </View>
      );
    default:
      return <View style={[styles.marker, styles.ring, { borderColor: c.outlineVariant }]} />;
  }
}

/** What the right-hand side says for a step. */
function sideText(step: Step): string {
  if (step.state === 'done') return 'Done';
  if (step.state === 'missed') return 'Missed';
  if (step.state === 'now') return step.when ? `Now · ${step.when}` : 'Now';
  return step.when ?? '';
}

/** Checklist of the event's steps (mockup "Event · window open"). */
export function StepList(props: { steps: Step[] }) {
  return (
    <View style={styles.panel} accessibilityLabel="Your steps">
      {props.steps.map((step, i) => {
        const tone =
          step.state === 'done'
            ? c.relief
            : step.state === 'now'
              ? c.primary
              : step.state === 'missed'
                ? c.error
                : c.onSurfaceVariant;
        return (
          <View key={step.key} style={[styles.row, i < props.steps.length - 1 && styles.divider]}>
            <Marker state={step.state} />
            <Text
              style={[
                styles.flex,
                step.state === 'now' && styles.strong,
                step.state === 'later' && { color: c.onSurfaceVariant },
              ]}
            >
              {step.title}
            </Text>
            <Text variant="bodyMedium" style={[styles.side, { color: tone }]}>
              {sideText(step)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    paddingHorizontal: space[4],
    paddingVertical: space[1],
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[3] },
  divider: { borderBottomWidth: 1, borderBottomColor: c.outlineVariant },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { borderWidth: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },
  strong: { fontFamily: fontFamily.semibold },
  side: { fontFamily: fontFamily.semibold, fontVariant: ['tabular-nums'] },
});
