import { useTheme } from '@kapitwatt/hooks';
import { Button, TextField } from '@kapitwatt/ui';
import { View } from 'react-native';

/** The message to households, with a way back to the written-for-you default once edited. */
export function MessageField({
  value,
  edited,
  onChange,
  onReset,
}: {
  value: string;
  edited: boolean;
  onChange: (text: string) => void;
  onReset: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space[2] }}>
      <TextField
        label="Message to households"
        multiline
        numberOfLines={4}
        value={value}
        onChangeText={onChange}
      />
      {edited ? (
        <View style={{ alignItems: 'flex-start' }}>
          <Button label="Reset to default" variant="text" onPress={onReset} />
        </View>
      ) : null}
    </View>
  );
}
