import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { Button, PasswordField } from '@/components/ui';
import { space } from '@/styles/theme';

const c = themes.light.color;

/** Withdrawing consent: what deleting erases, the password to confirm, and a way back. */
export function DeleteAccountPanel(props: {
  password: string;
  onChangePassword: (text: string) => void;
  /** The delete failure, in plain words; null when there is none. */
  error: string | null;
  deleting: boolean;
  onDelete: () => void;
  onKeep: () => void;
}) {
  return (
    <View style={styles.editor}>
      <Text variant="titleSmall" color="error">
        Withdraw consent and delete my account
      </Text>
      <Text variant="bodyMedium" color="onSurfaceVariant">
        This erases your profile, your Meralco account details, your meter photos and readings, and
        your Contribution Score. Barangay totals from past events stay, with nothing that identifies
        you. This cannot be undone.
      </Text>
      <PasswordField
        label="Enter your password to confirm"
        autoComplete="current-password"
        value={props.password}
        onChangeText={props.onChangePassword}
      />
      {props.error !== null ? <Text color="error">{props.error}</Text> : null}
      <Button
        label="Delete my account"
        disabled={props.password.length === 0}
        loading={props.deleting}
        onPress={props.onDelete}
      />
      <Button label="Keep my account" variant="secondary" onPress={props.onKeep} />
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    gap: space.md,
    padding: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: c.outlineVariant,
  },
});
