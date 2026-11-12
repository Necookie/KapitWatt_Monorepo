import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import type { Step } from '@/utils/event-steps';

const c = themes.light.color;
const DOT = 18;
/** Short names under the dots (the checklist's full titles are on the event screen). */
const SHORT: Record<string, string> = {
  commit: 'Commit',
  before: 'Before photo',
  cut: 'Cut',
  after: 'After photo',
  result: 'Result',
};

/**
 * The event's checklist as a trail of dots under the next step: done (filled, with a tick), now
 * (a ring around a dot), still to come (a faint ring) and missed (a ring in the error colour).
 * Not colour alone: each state also has its own shape, and the screen reader reads the words.
 */
export function StepTrail({ steps, ink }: { steps: Step[]; ink: string }) {
  const faint = withAlpha(ink, 0.35);
  return (
    <View
      style={styles.trail}
      accessible
      accessibilityLabel={steps
        .map((s) => `${SHORT[s.key] ?? s.title}: ${s.state === 'now' ? 'now' : s.state}`)
        .join(', ')}
    >
      {steps.map((s, i) => (
        <View key={s.key} style={styles.step}>
          {i > 0 ? (
            <View
              style={[
                styles.line,
                { backgroundColor: steps[i - 1]!.state === 'done' ? ink : faint },
              ]}
            />
          ) : null}
          <View
            style={[
              styles.dot,
              s.state === 'done' && { backgroundColor: ink },
              s.state === 'now' && { borderWidth: 2, borderColor: ink },
              s.state === 'later' && { borderWidth: 1.5, borderColor: faint },
              s.state === 'missed' && { borderWidth: 2, borderColor: c.error },
            ]}
          >
            {s.state === 'done' ? (
              <Icon name="check" size="sm" weight="bold" color="onPrimary" />
            ) : null}
            {s.state === 'now' ? <View style={[styles.core, { backgroundColor: ink }]} /> : null}
          </View>
          <Text
            variant="labelSmall"
            numberOfLines={1}
            style={{ color: s.state === 'later' ? faint : s.state === 'missed' ? c.error : ink }}
          >
            {SHORT[s.key] ?? s.title}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  trail: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: 4 },
  // From the middle of the previous dot to the middle of this one.
  line: { position: 'absolute', top: DOT / 2 - 1, right: '50%', width: '100%', height: 2 },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
  },
  core: { width: 8, height: 8, borderRadius: 4 },
});
