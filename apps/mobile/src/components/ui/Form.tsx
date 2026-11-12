import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, space, text } from '@/theme';
import { EyeIcon } from './EyeIcon';

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

/**
 * A password input. Hidden by default; the eye on the right shows it and hides it again, so a
 * household can check what it typed on a small keyboard.
 */
export function PasswordField(
  props: Omit<TextInputProps, 'secureTextEntry'> & { label: string; hint?: string },
) {
  const { label, hint, style, ...input } = props;
  const [shown, setShown] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordRow}>
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.passwordInput, style]}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          {...input}
          secureTextEntry={!shown}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={shown ? 'Hide password' : 'Show password'}
          accessibilityState={{ selected: shown }}
          hitSlop={space.sm}
          onPress={() => setShown((s) => !s)}
          style={styles.eye}
        >
          <EyeIcon crossed={shown} color={colors.muted} />
        </Pressable>
      </View>
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
  passwordRow: { justifyContent: 'center' },
  /** Room on the right so the text never runs under the eye. */
  passwordInput: { paddingRight: 52 },
  eye: {
    position: 'absolute',
    right: 0,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
