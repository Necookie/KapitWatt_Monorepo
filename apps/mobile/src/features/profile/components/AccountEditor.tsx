import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { Button, TextField } from '@/components/ui';
import { space } from '@/styles/theme';

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
        label="Save"
        disabled={!props.canSave}
        loading={props.saving}
        onPress={props.onSave}
      />
      <Button label="Cancel" variant="secondary" onPress={props.onCancel} />
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
