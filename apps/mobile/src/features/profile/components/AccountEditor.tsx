import { themes } from '@kapitwatt/styles';
import { Button, Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { space } from '@kapitwatt/tokens';
import { TextField } from '@/components/ui';

const c = themes.light.color;

/** Correcting the account holder's name and the service address. */
export function AccountEditor(props: {
  name: string;
  address: string;
  onChangeName: (text: string) => void;
  onChangeAddress: (text: string) => void;
  /** The save failure, in plain words; null when there is none. */
  error: string | null;
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.editor}>
      <TextField
        label="Account holder’s name"
        autoCapitalize="words"
        autoCorrect={false}
        value={props.name}
        onChangeText={props.onChangeName}
      />
      <TextField
        label="Service address"
        autoCapitalize="words"
        value={props.address}
        onChangeText={props.onChangeAddress}
      />
      {props.error !== null ? <Text color="error">{props.error}</Text> : null}
      <Button
        size="lg"
        fullWidth
        label="Save"
        disabled={!props.canSave}
        loading={props.saving}
        onPress={props.onSave}
      />
      <Button variant="outlined" size="lg" fullWidth label="Cancel" onPress={props.onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    gap: space[3],
    padding: space[4],
    borderBottomWidth: 1,
    borderBottomColor: c.outlineVariant,
  },
});
