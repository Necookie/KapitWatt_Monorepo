import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, space, text } from '@/theme';

/** A labelled text input. */
export function TextField(props: TextInputProps & { label: string; hint?: string }) {
  const { label, hint, style, ...input } = props;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, style]}
        accessibilityLabel={label}
        {...input}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

/** A checkbox with a long label (used for consent). */
export function Checkbox(props: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: props.checked }}
      onPress={() => props.onChange(!props.checked)}
      style={styles.checkRow}
    >
      <View style={[styles.box, props.checked && styles.boxChecked]}>
        {props.checked ? <Text style={styles.tick}>✓</Text> : null}
      </View>
      <Text style={styles.checkLabel}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  label: { ...text.body, fontWeight: '700', color: colors.ink },
  hint: { ...text.caption, color: colors.muted },
  input: {
    ...text.body,
    color: colors.ink,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  checkRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  box: {
    width: 24,
    height: 24,
    marginTop: 2,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.teal },
  tick: { color: colors.onDark, fontWeight: '700' },
  checkLabel: { ...text.body, color: colors.ink, flex: 1 },
});
