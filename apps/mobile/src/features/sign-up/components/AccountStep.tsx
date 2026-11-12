import { PASSWORD_MIN_LENGTH } from '@kapitwatt/shared';
import { StyleSheet, View } from 'react-native';
import { TextField } from '@/components/ui';
import { fieldOk, type StepProps } from '../utils/draft';
import { LiveCheck } from './LiveCheck';

/** `onPasswordFocus`: Alitaptap shuts its eyes while the password is typed. */
export function AccountStep({
  draft,
  set,
  onPasswordFocus,
}: StepProps & { onPasswordFocus: (focused: boolean) => void }) {
  const emailWrong = draft.email.length > 0 && !fieldOk('email', draft.email);
  return (
    <View style={styles.fields}>
      <TextField
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        error={emailWrong ? 'Enter a valid email address.' : undefined}
        value={draft.email}
        onChangeText={(email) => set({ email })}
      />
      <View style={styles.fieldWithCheck}>
        <TextField
          label="Password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          onFocus={() => onPasswordFocus(true)}
          onBlur={() => onPasswordFocus(false)}
          value={draft.password}
          onChangeText={(password) => set({ password })}
        />
        <LiveCheck ok={fieldOk('password', draft.password)}>
          {`${PASSWORD_MIN_LENGTH} characters or more`}
        </LiveCheck>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 20 },
  fieldWithCheck: { gap: 6 },
});
