import { Icon, type IconName } from '@kapitwatt/icons';
import { Logo, Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Button, Screen } from '@/components/ui';
import { colors, radius, space } from '@/theme';

const STEPS: { icon: IconName; name: string; detail: string; reward?: boolean }[] = [
  { icon: 'alert', name: 'Alert', detail: 'We tell you when the grid needs help.' },
  { icon: 'commit', name: 'Commit', detail: 'Choose how many kW you will cut.' },
  { icon: 'energy', name: 'Shift', detail: 'Switch off whatever you like.' },
  { icon: 'meterPhoto', name: 'Measure', detail: 'Your smart meter or two meter photos.' },
  {
    icon: 'reward',
    name: 'Reward',
    detail: 'Bill credit, barangay bonus and points.',
    reward: true,
  },
];

/**
 * First screen for a phone with no household signed in: what KapitWatt is, then join or log in.
 * No top bar; the logo opens the screen (mockup page 2, Welcome).
 */
export default function WelcomeScreen() {
  return (
    <Screen roomy noHeader>
      <StatusBar style="dark" />
      <Logo height={32} />
      <View style={styles.intro}>
        <Text variant="headlineMedium">Help the grid. Get paid for it.</Text>
        <Text color="onSurfaceVariant">
          When Luzon is short of power, cut some of your load and earn a bill credit for what you
          save.
        </Text>
      </View>

      <View style={styles.group}>
        <Text variant="titleMedium" accessibilityRole="header">
          How it works
        </Text>
        {STEPS.map((step) => (
          <View key={step.name} style={styles.row}>
            <View style={[styles.tile, step.reward && styles.tileReward]}>
              <Icon
                name={step.icon}
                color={step.reward ? 'onTertiaryContainer' : 'onPrimaryContainer'}
              />
            </View>
            <View style={styles.rowText}>
              <Text variant="titleMedium">{step.name}</Text>
              <Text variant="bodyMedium" color="onSurfaceVariant">
                {step.detail}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Create account" onPress={() => router.push('/sign-up')} />
        <Button label="Log in" variant="secondary" onPress={() => router.push('/login')} />
        <Text variant="bodySmall" color="onSurfaceVariant" align="center">
          Laguna pilot. Households, alerts and reward rates are simulated.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.xs },
  group: {
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.lg,
  },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  tile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  tileReward: { backgroundColor: colors.rewardContainer },
  rowText: { flex: 1, gap: 2 },
  actions: { marginTop: 'auto', gap: space.md },
});
