import { StyleSheet, TextInput } from 'react-native';
import { colors, font, radius, space } from '@/styles/theme';

/** Compact legacy text input (town target overrides). */
export function TextField({
  value,
  onChangeText,
  multiline,
  width,
  numeric,
  label,
}: {
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  width?: number;
  numeric?: boolean;
  label: string;
}) {
  return (
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      inputMode={numeric ? 'decimal' : 'text'}
      style={[
        styles.input,
        multiline ? styles.multiline : null,
        width ? { width } : null,
        numeric ? { fontVariant: ['tabular-nums'] } : null,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 32,
    paddingHorizontal: space.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    fontFamily: font.family,
    fontSize: font.md,
    color: colors.ink,
  },
  multiline: { height: 84, paddingVertical: space.sm, lineHeight: 18 },
});
