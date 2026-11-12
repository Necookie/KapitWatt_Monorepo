import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, space } from '@/theme';

const t = themes.light;
const c = t.color;

/**
 * A labelled text input with the same frame as a button: 56 px tall, 12 px corners (mockup page 1,
 * Log in). White fill so it reads as tappable; 2 px primary border while focused, error border and
 * message when `error` is set. Password fields (`secureTextEntry`) get a show/hide eye.
 */
export function TextField(
  props: Omit<TextInputProps, 'style'> & { label: string; hint?: string; error?: string },
) {
  const { label, hint, error, secureTextEntry, onFocus, onBlur, editable = true, ...input } = props;
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const strong = focused || !!error;

  return (
    <View style={styles.field}>
      <Text variant="labelLarge" color={error ? 'error' : 'onSurfaceVariant'}>
        {label}
      </Text>
      <View
        style={[
          styles.frame,
          {
            borderWidth: strong ? t.borderWidth.strong : t.borderWidth.hairline,
            borderColor: error ? c.error : focused ? c.primary : c.outline,
            // Keep the text still when the border thickens.
            paddingLeft: strong ? 15 : 16,
            backgroundColor: editable ? c.surfaceContainerLowest : c.surfaceContainerHigh,
          },
        ]}
      >
        <TextInput
          {...input}
          editable={editable}
          secureTextEntry={secureTextEntry && !revealed}
          accessibilityLabel={label}
          placeholderTextColor={c.onSurfaceVariant}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={styles.input}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed((r) => !r)}
            style={styles.eye}
          >
            <Icon name={revealed ? 'hide' : 'show'} color="onSurfaceVariant" />
          </Pressable>
        ) : null}
      </View>
      {error || hint ? (
        <Text variant="bodyMedium" color={error ? 'error' : 'onSurfaceVariant'}>
          {error ?? hint}
        </Text>
      ) : null}
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
      accessibilityLabel={props.label}
      hitSlop={space.sm}
      onPress={() => props.onChange(!props.checked)}
      style={styles.checkRow}
    >
      <View style={[styles.box, props.checked && styles.boxChecked]}>
        {props.checked ? <Icon name="check" size="sm" weight="bold" color="onPrimary" /> : null}
      </View>
      <Text style={styles.checkLabel}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6, alignSelf: 'stretch' },
  frame: {
    height: t.size.controlLg,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  input: {
    ...t.text.bodyLarge,
    flex: 1,
    minWidth: 0,
    height: '100%',
    color: c.onSurface,
    paddingVertical: 0,
  },
  eye: {
    width: t.size.touchTarget,
    height: t.size.touchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: radius.sm / 2,
    borderWidth: 2,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.teal },
  checkLabel: { flex: 1 },
});
