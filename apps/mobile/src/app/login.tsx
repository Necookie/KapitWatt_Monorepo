import { LoginInput } from '@kapitwatt/shared';
import { Logo, Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, TextField } from '@/components/ui';
import { ApiError, errorCode } from '@/lib/api';
import { useLogin } from '@/lib/queries';
import { space } from '@/theme';

function loginError(e: Error): string {
  return describeError(
    e,
    {
      invalid_credentials: 'Wrong email or password.',
      // An API from before logins existed answers 404 for this route.
      not_found:
        'The server does not support logging in yet. Ask the KapitWatt team to update the API.',
    },
    'Could not log you in. Try again.',
  );
}

/**
 * Email and password login for a household that already joined (mockup page 1, Log in):
 * light top bar, one filled action, the low-emphasis links as text and outlined buttons.
 */
export default function LoginScreen() {
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const filled = email.trim() !== '' && password !== '';
  const submit = () => {
    if (!filled || login.isPending) return;
    // The button is live as soon as both fields have text, so a mistyped email gets an answer
    // instead of a button that silently does nothing.
    const parsed = LoginInput.safeParse({ email, password });
    if (!parsed.success) {
      login.reset();
      setFormError('Enter a valid email address.');
      return;
    }
    setFormError(null);
    login.mutate(parsed.data, {
      onSuccess: (res) => startOver(res.household.needsRehearsal ? '/rehearsal' : '/'),
    });
  };

  const submit = () => {
    if (!parsed.success) return;
    login.mutate(parsed.data, {
      onSuccess: (res) => {
        router.dismissAll();
        router.replace(res.household.needsRehearsal ? '/rehearsal' : '/');
      },
    });
  };

  return (
    <Screen roomy>
      <View style={styles.intro}>
        <Logo height={32} />
        <View style={styles.heading}>
          <Text variant="headlineMedium" accessibilityRole="header">
            Welcome back
          </Text>
          <Text color="onSurfaceVariant">Log in to see grid alerts and your rewards.</Text>
        </View>
      </View>

      <View style={styles.form}>
        <TextField
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
        />
        <View>
          <TextField
            label="Password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            value={password}
            onChangeText={setPassword}
          />
          <Button
            label="Forgot password?"
            variant="text"
            align="end"
            onPress={() => router.push('/forgot-password')}
          />
        </View>
        {login.isError ? <Text color="error">{loginError(login.error)}</Text> : null}
        <Button
          label="Log in"
          disabled={!parsed.success}
          loading={login.isPending}
          onPress={submit}
        />
      </View>

      <View style={styles.bottom}>
        <Text variant="bodyMedium" color="onSurfaceVariant" align="center">
          New to KapitWatt?
        </Text>
        <Button
          label="Create account"
          variant="secondary"
          onPress={() => router.replace('/sign-up')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.lg },
  heading: { gap: space.xs },
  form: { gap: space.lg },
  bottom: { marginTop: 'auto', gap: space.md },
});
