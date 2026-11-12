import { UpdateProfileInput } from '@kapitwatt/shared';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button, Card, ErrorState, Loading, Row, Screen, TextField } from '@/components/ui';
import { ApiError, describeError } from '@/lib/api';
import { startOver } from '@/lib/nav';
import { useDeleteAccount, useLogout, useMe, useUpdateProfile } from '@/lib/queries';
import { colors, text } from '@/theme';

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

/**
 * The household's own data and its privacy controls (Data Privacy Act 2012): see it, correct it,
 * turn alerts off, log out, and withdraw consent by deleting the account.
 */
export default function ProfileScreen() {
  const me = useMe();
  const update = useUpdateProfile();
  const logout = useLogout();
  const remove = useDeleteAccount();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');

  if (me.error instanceof ApiError && me.error.status === 401) return <Redirect href="/welcome" />;
  if (me.isPending) return <Loading />;
  if (me.isError) return <ErrorState onRetry={() => void me.refetch()} />;
  const h = me.data;

  const edit = UpdateProfileInput.safeParse({ accountName: name, serviceAddress: address });
  const leave = () => startOver('/welcome');

  return (
    <Screen onRefresh={me.refetch}>
      <Card title="My data">
        <Row label="Email" value={h.email ?? 'Not set'} />
        <Row label="Account number" value={h.accountNumberMasked ?? 'Not set'} />
        {editing ? (
          <>
            <TextField
              label="Account holder’s name"
              autoCapitalize="words"
              autoCorrect={false}
              value={name}
              onChangeText={setName}
            />
            <TextField
              label="Service address"
              autoCapitalize="words"
              value={address}
              onChangeText={setAddress}
            />
            {update.isError ? (
              <Text style={styles.error}>
                {describeError(update.error, {}, 'Could not save your changes. Try again.')}
              </Text>
            ) : null}
            <Button
              label="Save"
              disabled={!edit.success}
              loading={update.isPending}
              onPress={() => {
                if (!edit.success) return;
                update.mutate(edit.data, { onSuccess: () => setEditing(false) });
              }}
            />
            <Button label="Cancel" variant="secondary" onPress={() => setEditing(false)} />
          </>
        ) : (
          <>
            <Row label="Account holder" value={h.accountName ?? 'Not set'} />
            <Row label="Service address" value={h.serviceAddress ?? 'Not set'} />
            <Button
              label="Correct name or address"
              variant="secondary"
              onPress={() => {
                update.reset();
                setName(h.accountName ?? '');
                setAddress(h.serviceAddress ?? '');
                setEditing(true);
              }}
            />
          </>
        )}
      </Card>

      <Card title="My meter">
        <Row label="Barangay" value={`${h.barangayName}, ${h.municipality}`} />
        <Row label="Meter" value={h.meterType === 'ami' ? 'Smart meter' : 'Regular meter'} />
        <Row label="Serial number" value={h.meterSerial} />
        <Row label="Monthly use" value={`${h.billAvgKwhMonth} kWh`} />
      </Card>

      <Card title="Grid alerts">
        <Row label="Alerts" value={h.optedIn ? 'On' : 'Off'} strong />
        <Text style={styles.body}>
          {h.optedIn
            ? 'You are notified of grid alerts and can join events.'
            : 'You are opted out: no alerts and no events until you turn this back on.'}
        </Text>
        <Button
          label={h.optedIn ? 'Turn alerts off' : 'Turn alerts on'}
          variant="secondary"
          loading={update.isPending && !editing}
          onPress={() => update.mutate({ optedIn: !h.optedIn })}
        />
      </Card>

      <Card title="Privacy">
        <Row label="Consent given" value={h.consentAt ? dateLabel(h.consentAt) : 'Not recorded'} />
        <Button
          label="Read the privacy notice"
          variant="secondary"
          onPress={() => router.push('/privacy')}
        />
      </Card>

      <Button
        label="Log out"
        variant="secondary"
        loading={logout.isPending}
        onPress={() => logout.mutate(undefined, { onSettled: leave })}
      />

      <Card title="Withdraw consent and delete my account">
        <Text style={styles.body}>
          This erases your profile, your Meralco account details, your meter photos and readings,
          and your points and credits. Barangay totals from past events stay, with nothing that
          identifies you. This cannot be undone.
        </Text>
        {deleting ? (
          <>
            <TextField
              label="Enter your password to confirm"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />
            {remove.isError ? (
              <Text style={styles.error}>
                {describeError(
                  remove.error,
                  { invalid_credentials: 'Wrong password.' },
                  'Could not delete your account. Try again.',
                )}
              </Text>
            ) : null}
            <Button
              label="Delete my account"
              disabled={password.length === 0}
              loading={remove.isPending}
              onPress={() => remove.mutate(password, { onSuccess: leave })}
            />
            <Button
              label="Keep my account"
              variant="secondary"
              onPress={() => {
                setDeleting(false);
                setPassword('');
                remove.reset();
              }}
            />
          </>
        ) : (
          <Button label="Delete my account" variant="secondary" onPress={() => setDeleting(true)} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...text.body, color: colors.muted },
  error: { ...text.body, color: colors.red },
});
