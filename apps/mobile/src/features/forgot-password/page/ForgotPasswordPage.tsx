import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button, Card, Screen, SimulatedNote } from '@/components/ui';
import { colors, text } from '@/styles/theme';

/**
 * Password reset is not built in the pilot: it needs an email service the demo does not have.
 * The screen says so plainly instead of pretending to send a link.
 */
export default function ForgotPasswordPage() {
  return (
    <Screen>
      <Card title="Password reset is not available yet">
        <Text style={styles.body}>
          In the full program you would get a reset link by email. This pilot does not send email,
          so a forgotten password cannot be reset from the app.
        </Text>
        <Text style={styles.body}>
          For the demo, ask the KapitWatt team to remove your test account, then create it again.
        </Text>
      </Card>
      <Button label="Back to log in" variant="secondary" onPress={() => router.back()} />
      <SimulatedNote>Hackathon pilot: no email is ever sent from KapitWatt.</SimulatedNote>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...text.body, color: colors.muted },
});
