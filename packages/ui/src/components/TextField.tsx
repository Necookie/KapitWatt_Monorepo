import { useTheme } from '@kapitwatt/hooks';
import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './Text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Unit shown inside the field on the right: "kW", "kWh", "PHP". */
  suffix?: string;
  /** Help under the field. Replaced by `error` when there is one. */
  supportingText?: string;
  error?: string;
};

/** Outlined field with the label above it (stays readable when filled, no floating-label motion). */
export function TextField({
  label,
  suffix,
  supportingText,
  error,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}: TextFieldProps) {
  const t = useTheme();
  const c = t.color;
  const [focused, setFocused] = useState(false);
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
            { flex: 1, color: c.onSurface, paddingVertical: t.space[3], outlineWidth: 0 },
          ]}
        />
        {suffix ? (
          <Text variant="bodyLarge" color="onSurfaceVariant">
            {suffix}
          </Text>
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
