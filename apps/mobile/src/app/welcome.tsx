import { themes } from '@kapitwatt/styles';
import { Logo, Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { MASCOT_POSES } from '@/components/mascot/poses';
import { Button, Screen } from '@/components/ui';
import { space } from '@/theme';

const c = themes.light.color;

/** Glow behind the mascot: the warm tone from the mascot artwork itself. */
const MASCOT_GLOW = '#FFEDE8';

/** The flow in three beats; the last one is the reward, in Kuryente Orange. */
const STEPS = [
  { name: 'Alert', detail: 'We tell you when' },
  { name: 'Cut', detail: 'Switch some off' },
  { name: 'Reward', detail: 'Bill credit + points', reward: true },
] as const;

/**
 * First screen for a phone with no household signed in: what KapitWatt is, then join or log in.
 * Mockup "Welcome 1 · Mascot hero, 3 steps": the mascot opens the screen, no icons.
 */
export default function WelcomeScreen() {
  return (
    <Screen roomy noHeader>
      <Logo height={26} />

      <View style={styles.hero}>
        <View
          style={styles.glow}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <SvgXml xml={MASCOT_POSES.neutral} width={136} height={158} style={styles.mascot} />
        </View>
        <View style={styles.intro}>
          <Text variant="headlineMedium" align="center" accessibilityRole="header">
            {'Help the grid.\nEarn rewards.'}
          </Text>
          <Text color="onSurfaceVariant" align="center">
            When Luzon runs short on power, cut a little and earn rewards.
          </Text>
        </View>
      </View>

      <View style={styles.steps} accessibilityLabel="How it works">
        <View style={styles.line} />
        {STEPS.map((step, i) => (
          <View key={step.name} style={styles.step}>
            <View style={[styles.dot, 'reward' in step && styles.dotReward]}>
              <Text
                variant="titleMedium"
                style={{ color: 'reward' in step ? c.onBrandAccent : c.onPrimary }}
              >
                {String(i + 1)}
              </Text>
            </View>
            <Text variant="titleMedium" align="center">
              {step.name}
            </Text>
            <Text variant="bodySmall" color="onSurfaceVariant" align="center">
              {step.detail}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {/* One way forward: Log in also offers "Create account" for new households. */}
        <Button label="Continue" onPress={() => router.push('/login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 20, marginTop: space.sm },
  glow: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: MASCOT_GLOW,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  mascot: { marginBottom: -10 },
  intro: { gap: space.sm },
  steps: { flexDirection: 'row', gap: space.sm },
  /** Joins the three dots, behind them. */
  line: {
    position: 'absolute',
    top: 19,
    left: '16%',
    right: '16%',
    height: 2,
    backgroundColor: c.outlineVariant,
  },
  step: { flex: 1, alignItems: 'center', gap: space.sm },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotReward: { backgroundColor: c.brandAccent },
  actions: { marginTop: 'auto', gap: space.md },
});
