import { useTheme } from '@kapitwatt/hooks';
import type { ColorRoles, TypeRole } from '@kapitwatt/tokens';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

export type TextProps = RNTextProps & {
  /** Material 3 type role, or a `data*` role for kW, kWh, PHP and countdowns (tabular digits). */
  variant?: TypeRole;
  /** Colour role. Defaults to onSurface. */
  color?: keyof ColorRoles;
  align?: 'left' | 'center' | 'right';
};

export function Text({
  variant = 'bodyLarge',
  color = 'onSurface',
  align,
  style,
  ...rest
}: TextProps) {
  const t = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        t.text[variant],
        { color: t.color[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
