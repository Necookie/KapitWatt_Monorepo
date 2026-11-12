import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button, Card, Screen, SimulatedNote } from '@/components/ui';
import { colors, text } from '@/theme';

/** First screen for a phone with no household signed in: what KapitWatt is, then join or log in. */
export default function WelcomeScreen() {
  return (
    <Screen>
      <Text style={styles.headline}>Help the grid. Get paid for it.</Text>
      <Text style={styles.body}>
        When Luzon is short of power, KapitWatt alerts you. You commit to cutting some of your load
        during the peak window, and you earn a bill credit for the energy Meralco can verify you
        saved.
      </Text>
      <Card title="How it works">
        <Text style={styles.step}>1. Alert: we notify you of a yellow or red grid alert.</Text>
        <Text style={styles.step}>2. Commit: you choose how many kW to cut.</Text>
        <Text style={styles.step}>3. Shift: you switch off whatever you like.</Text>
        <Text style={styles.step}>4. Measure: your smart meter or two meter photos prove it.</Text>
        <Text style={styles.step}>5. Reward: a credit, a barangay bonus and points.</Text>
      </Card>
      <Button label="Create account" onPress={() => router.push('/sign-up')} />
      <Button label="Log in" variant="secondary" onPress={() => router.push('/login')} />
      <SimulatedNote>
        Laguna pilot for a hackathon. Households, NGCP alerts and reward rates are simulated.
      </SimulatedNote>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { ...text.headline, color: colors.ink },
  body: { ...text.body, color: colors.muted },
  step: { ...text.body, color: colors.ink },
});
