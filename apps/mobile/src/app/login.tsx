import { LoginInput } from '@kapitwatt/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button, Card, PasswordField, Screen, TextField } from '@/components/ui';
import { describeError } from '@/lib/api';
import { startOver } from '@/lib/nav';
import { useLogin } from '@/lib/queries';
import { colors, text } from '@/theme';

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

/** Email and password login for a household that already joined. */
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

  return (
    <Screen>
      <Card>
        <TextField
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={submit}
          value={password}
          onChangeText={setPassword}
        />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        {login.isError ? <Text style={styles.error}>{loginError(login.error)}</Text> : null}
        <Button label="Log in" disabled={!filled} loading={login.isPending} onPress={submit} />
      </Card>
      <Button
        label="Forgot password?"
        variant="secondary"
        onPress={() => router.push('/forgot-password')}
      />
      <Button
        label="Create account"
        variant="secondary"
        onPress={() => router.replace('/sign-up')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { ...text.body, color: colors.red },
});
