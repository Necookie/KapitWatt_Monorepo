import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Button, Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { LivingMascot } from '@/components/mascot/LivingMascot';
import type { BrownoutRisk } from '@/utils/brownout';
import type { NextStep } from '../hooks/useNextStep';
import { CountdownLine } from './CountdownLine';
import { StepTrail } from './StepTrail';

const c = themes.light.color;

/** The card's tones: an alert or the practice run on primary, a result on reward, quiet nights plain. */
const TONE = {
  primary: { bg: c.primaryContainer, ink: c.onPrimaryContainer },
  reward: { bg: c.tertiaryContainer, ink: c.onTertiaryContainer },
  quiet: { bg: c.surfaceContainerLow, ink: c.onSurface },
} as const;

const OVERLINE = { event: 'Do this next', practice: 'Before your first alert', quiet: 'All quiet' };

/**
 * The top of Home: the one thing to do next, said by Alitaptap in the mood of the moment. During
 * an alert: the step, its countdown, the action that opens the right screen, and the event's trail
 * of steps underneath. The brownout risk (simulated) shows under the step when the alert marks one.
 */
export function NextStepCard({ step, risk }: { step: NextStep; risk: BrownoutRisk | null }) {
  const tone = TONE[step.kind === 'quiet' ? 'quiet' : step.mood.tone];
  const action = step.card.action;
  return (
    <View style={[styles.card, { backgroundColor: tone.bg }]}>
      <View style={styles.head}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <LivingMascot pose={step.mood.pose} height={84} pokeable />
        </View>
        <View style={styles.words}>
          <Text variant="labelMedium" style={[styles.overline, { color: tone.ink }]}>
            {OVERLINE[step.kind].toUpperCase()}
          </Text>
          <Text variant="titleLarge" accessibilityRole="header" style={{ color: tone.ink }}>
            {step.card.title}
          </Text>
          {step.countdown ? (
            <CountdownLine label={step.countdown.label} at={step.countdown.at} color={tone.ink} />
          ) : null}
        </View>
      </View>

      <Text variant="bodyMedium" style={{ color: tone.ink }}>
        {step.card.body}
      </Text>
      {risk ? (
        <View style={styles.risk}>
          <Text variant="titleSmall" style={{ color: tone.ink }}>
            {risk.headline}
          </Text>
          <Text variant="bodySmall" style={{ color: tone.ink }}>
            {risk.line}
          </Text>
        </View>
      ) : null}

      {action ? (
        <Button
          size="lg"
          fullWidth
          label={action.label}
          onPress={() => step.onAction(action.kind)}
        />
      ) : null}
      {step.steps ? <StepTrail steps={step.steps} ink={tone.ink} /> : null}
      {step.onDetails ? (
        <Button variant="text" align="center" label="See the event" onPress={step.onDetails} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space[4], gap: space[3] },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  words: { flex: 1, gap: 2 },
  overline: { letterSpacing: 0.5 },
  risk: { gap: 2 },
});
