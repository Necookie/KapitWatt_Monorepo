import { Icon } from '@kapitwatt/icons';
import { TextField as DsTextField, Text, type TextFieldProps } from '@kapitwatt/ui';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, space } from '@kapitwatt/tokens';
import { themes } from '@kapitwatt/styles';
import { useReveal, type RevealTarget } from './reveal';

const c = themes.light.color;

/**
 * The design system's text field (@kapitwatt/ui: outlined, label above, error or supporting text
 * below, the eye on password fields, `ref` to the input), plus one thing only the phone needs: on
 * focus the screen scrolls the whole field into view above the keyboard (Screen).
 */
export function TextField(props: TextFieldProps) {
  const box = useRef<RevealTarget>(null);
  const reveal = useReveal();
  return (
    <View ref={box} style={styles.field}>
      <DsTextField
        {...props}
        onFocus={(e) => {
          reveal(box.current);
          props.onFocus?.(e);
        }}
      />
    </View>
  );
}

/** A password field: the text field hidden, with the eye to show it and hide it again. */
export function PasswordField(props: Omit<TextFieldProps, 'secureTextEntry'>) {
  return <TextField autoCapitalize="none" autoCorrect={false} {...props} secureTextEntry />;
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
      hitSlop={space[2]}
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
  field: { alignSelf: 'stretch' },
  checkRow: { flexDirection: 'row', gap: space[3], alignItems: 'flex-start' },
  box: {
    width: 24,
    height: 24,
    marginTop: 2,
    borderRadius: radius.sm / 2,
    borderWidth: 2,
    borderColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: c.primary },
  checkLabel: { flex: 1 },
});
