import { themes } from '@kapitwatt/styles';
import { Mascot, Text, type MascotPose } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { fonts } from '@/styles/theme';

const c = themes.light.color;

/** Glow behind the mascot: the warm tone from the mascot artwork itself. */
const BADGE = '#FFEDE8';

const TONES = {
  /** Guidance on a normal step. */
  primary: { bubble: c.primaryContainer, label: c.primary, line: c.onPrimaryContainer },
  /** Rewards and celebrations (Kuryente Orange, never a warning). */
  reward: { bubble: c.tertiaryContainer, label: c.tertiary, line: c.onTertiaryContainer },
} as const;

/**
 * The Alitaptap mascot talking to the household (mockup option A): the mascot in a round badge and
 * a speech bubble that is the screen's heading, a small label naming the step over one short line.
 */
export function MascotHeader(props: {
  label: string;
  line: string;
  pose?: MascotPose;
  tone?: keyof typeof TONES;
}) {
  const tone = TONES[props.tone ?? 'primary'];
  return (
    <View style={styles.row}>
      <View
        style={styles.badge}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.mascot}>
          <Mascot pose={props.pose ?? 'neutral'} height={88} />
        </View>
      </View>
      <View style={[styles.bubble, { backgroundColor: tone.bubble }]}>
        <View style={[styles.tail, { backgroundColor: tone.bubble }]} />
        <Text variant="labelMedium" style={[styles.label, { color: tone.label }]}>
          {props.label.toUpperCase()}
        </Text>
        <Text
          variant="titleLarge"
          accessibilityRole="header"
          style={[styles.line, { color: tone.line }]}
        >
          {props.line}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: BADGE,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  mascot: { marginBottom: -10 },
  bubble: { flex: 1, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16 },
  tail: {
    position: 'absolute',
    left: -6,
    top: '50%',
    marginTop: -7,
    width: 14,
    height: 14,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  label: { fontFamily: fonts.semibold, letterSpacing: 0.5, marginBottom: 2 },
  line: { fontSize: 20, lineHeight: 26 },
});
