import { ACCOUNT_NUMBER_DIGITS } from '@kapitwatt/shared';
import { StyleSheet, View } from 'react-native';
import { TextField } from '@/components/ui';
import { fieldOk, type StepProps } from '../utils/draft';
import { DigitSlots } from './DigitSlots';

export function MeralcoStep({ draft, set }: StepProps) {
  const numberWrong =
    draft.accountNumber.length > 0 && !fieldOk('accountNumber', draft.accountNumber);
  return (
    <View style={styles.fields}>
      <DigitSlots
        label="Account number (CAN)"
        hint="On your bill"
        error={numberWrong ? `The account number has ${ACCOUNT_NUMBER_DIGITS} digits.` : undefined}
        length={ACCOUNT_NUMBER_DIGITS}
        ok={fieldOk('accountNumber', draft.accountNumber)}
        value={draft.accountNumber}
        onChange={(accountNumber) => set({ accountNumber })}
      />
      <TextField
        label="Account holder"
        autoCapitalize="words"
        autoCorrect={false}
        value={draft.accountName}
        onChangeText={(accountName) => set({ accountName })}
      />
      <TextField
        label="Service address"
        placeholder="House no. and street"
        autoCapitalize="words"
        value={draft.serviceAddress}
        onChangeText={(serviceAddress) => set({ serviceAddress })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 20 },
});
