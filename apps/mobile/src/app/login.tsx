import { LoginInput } from '@kapitwatt/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button, Card, Screen, TextField } from '@/components/ui';
import { ApiError, errorCode } from '@/lib/api';
import { useLogin } from '@/lib/queries';
import { colors, text } from '@/theme';

function loginError(e: Error): string {
  const code = errorCode(e);
  if (code === 'invalid_credentials') return 'Wrong email or password.';
  if (e instanceof ApiError && e.status === 429) {
    return 'Too many attempts. Wait a minute, then try again.';
  }
  return 'Could not log you in. Check your connection and try again.';
}

/** Email and password login for a household that already joined. */
export default function LoginScreen() {
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const parsed = LoginInput.safeParse({ email, password });

  return (
    <Screen>
      <Card>
        <TextField
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
        />
        {login.isError ? <Text style={styles.error}>{loginError(login.error)}</Text> : null}
        <Button
          label="Log in"
          disabled={!parsed.success}
          loading={login.isPending}
          onPress={() => {
            if (!parsed.success) return;
            login.mutate(parsed.data, {
              onSuccess: (res) => {
                router.dismissAll();
                router.replace(res.household.needsRehearsal ? '/rehearsal' : '/');
              },
            });
          }}
        />
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
