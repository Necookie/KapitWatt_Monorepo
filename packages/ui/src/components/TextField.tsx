import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './Text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Unit shown inside the field on the right: "kW", "kWh", "PHP". */
  suffix?: string;
  /** Help under the field. Replaced by `error` when there is one. */
  supportingText?: string;
  error?: string;
  /** Reaches the input itself, e.g. to move focus to it from the field before. */
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

/**
 * Outlined field with the label above it (stays readable when filled, no floating-label motion).
 * A password field (`secureTextEntry`) gets an eye on the right to show and hide what was typed.
 */
export function TextField({
  label,
  suffix,
  supportingText,
  error,
  onFocus,
  onBlur,
  editable = true,
  secureTextEntry,
  ref,
  ...rest
}: TextFieldProps) {
  const t = useTheme();
  const c = t.color;
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const borderColor = error ? c.error : focused ? c.primary : c.outline;
  return (
    <View style={{ gap: t.space[1], alignSelf: 'stretch' }}>
      <Text variant="labelLarge" color={error ? 'error' : 'onSurfaceVariant'}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: t.size.controlLg,
          paddingHorizontal: t.space[4],
          borderRadius: t.radius.xs,
          borderWidth: focused || error ? t.borderWidth.strong : t.borderWidth.hairline,
          borderColor,
          backgroundColor: editable ? 'transparent' : c.surfaceContainerHighest,
        }}
      >
        <TextInput
          {...rest}
          ref={ref}
          secureTextEntry={secureTextEntry && !revealed}
          editable={editable}
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
          style={[
            t.text.bodyLarge,
            // The field's border shows focus. Width 0 alone is not enough: the browser's focus ring is
            // outline-style auto, which ignores the width.
            {
              flex: 1,
              color: c.onSurface,
              paddingVertical: t.space[3],
              outlineWidth: 0,
              // RN's types allow only solid, dotted or dashed; react-native-web passes 'none' on.
              outlineStyle: 'none',
            } as object,
          ]}
        />
        {suffix ? (
          <Text variant="bodyLarge" color="onSurfaceVariant">
            {suffix}
          </Text>
        ) : null}
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed((r) => !r)}
            style={{
              width: t.size.touchTarget,
              height: t.size.touchTarget,
              marginRight: -t.space[3],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={revealed ? 'hide' : 'show'} color="onSurfaceVariant" />
          </Pressable>
        ) : null}
      </View>
      {error || supportingText ? (
        <Text
          variant="bodySmall"
          color={error ? 'error' : 'onSurfaceVariant'}
          accessibilityLiveRegion={error ? 'polite' : 'none'}
        >
          {error ?? supportingText}
        </Text>
      ) : null}
    </View>
  );
}
