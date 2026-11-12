import { Button, Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { themes } from '@kapitwatt/styles';
import { Card, Screen, SimulatedNote } from '@/components/ui';

const c = themes.light.color;

/**
 * Password reset is not built in the pilot: it needs an email service the demo does not have.
 * The screen says so plainly instead of pretending to send a link.
 */
export default function ForgotPasswordPage() {
  return (
    <Screen>
      <Card title="Password reset is not available yet">
        <Text variant="bodyLarge" style={styles.body}>
          In the full program you would get a reset link by email. This pilot does not send email,
          so a forgotten password cannot be reset from the app.
        </Text>
        <Text variant="bodyLarge" style={styles.body}>
          For the demo, ask the KapitWatt team to remove your test account, then create it again.
        </Text>
      </Card>
      <Button
        variant="outlined"
        size="lg"
        fullWidth
        label="Back to log in"
        onPress={() => router.back()}
      />
      <SimulatedNote>Hackathon pilot: no email is ever sent from KapitWatt.</SimulatedNote>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { color: c.onSurfaceVariant },
});
