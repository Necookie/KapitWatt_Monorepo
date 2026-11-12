import { useTheme } from '@kapitwatt/hooks';
import { withAlpha, type Space } from '@kapitwatt/tokens';
import type { ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { usePressState } from './usePressState';

export type CardProps = {
  children: ReactNode;
  /** filled: grouped content on the page. outlined: content that needs a clear edge (lists, forms). Flat: no shadows. */
  variant?: 'filled' | 'outlined';
  padding?: Space;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function Card({
  children,
  variant = 'filled',
  padding = 4,
  onPress,
  accessibilityLabel,
  style,
}: CardProps) {
  const t = useTheme();
  const { hovered, focused, handlers } = usePressState();
  const base: ViewStyle = {
    borderRadius: t.radius.md,
    overflow: 'hidden',
    backgroundColor: variant === 'filled' ? t.color.surfaceContainerHighest : t.color.surface,
    borderWidth: variant === 'outlined' ? t.borderWidth.hairline : 0,
    borderColor: t.color.outlineVariant,
  };
  if (!onPress) return <View style={[base, { padding: t.space[padding] }, style]}>{children}</View>;
  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        base,
        focused
          ? {
              outlineStyle: 'solid',
              outlineWidth: t.borderWidth.focus,
              outlineColor: t.color.focusRing,
              outlineOffset: t.borderWidth.focusOffset,
            }
          : null,
        style,
      ]}
    >
      {({ pressed }) => (
        <View
          style={{
            padding: t.space[padding],
            backgroundColor: withAlpha(
              t.color.onSurface,
              pressed ? t.stateLayer.pressed : hovered ? t.stateLayer.hover : 0,
            ),
          }}
        >
          {children}
        </View>
      )}
    </Pressable>
  );
}
