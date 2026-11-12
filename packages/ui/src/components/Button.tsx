import { useTheme } from '@kapitwatt/hooks';
import { withAlpha } from '@kapitwatt/tokens';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import { Text } from './Text';
import { usePressState } from './usePressState';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  /** filled: the one main action per screen. tonal: secondary. outlined and text: low emphasis. */
  variant?: 'filled' | 'tonal' | 'outlined' | 'text';
  /** md = 40 (dashboard, dense UI). lg = 56 (household app primary actions, outdoors, one hand). */
  size?: 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  /** Where a button that is not full width sits in its row (a centred text link, say). */
  align?: 'start' | 'center' | 'end';
};

const ALIGN = { start: 'flex-start', center: 'center', end: 'flex-end' } as const;

export function Button({
  label,
  variant = 'filled',
  size = 'md',
  icon,
  loading = false,
  fullWidth,
  align = 'start',
  disabled,
  ...rest
}: ButtonProps) {
  const t = useTheme();
  const { hovered, focused, handlers } = usePressState();
  const c = t.color;
  const [container, content] = (
    {
      filled: [c.primary, c.onPrimary],
      tonal: [c.secondaryContainer, c.onSecondaryContainer],
      outlined: ['transparent', c.primary],
      text: ['transparent', c.primary],
    } as const
  )[variant];
  const off = disabled || loading;
  const height = size === 'lg' ? t.size.controlLg : t.size.controlMd;
  const slop = Math.max(0, (t.size.touchTarget - height) / 2);

  return (
    <Pressable
      {...rest}
      {...handlers}
      disabled={off}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: loading }}
      style={{
        height,
        minWidth: 64,
        alignSelf: fullWidth ? 'stretch' : ALIGN[align],
        borderRadius: t.radius.full,
        overflow: 'hidden',
        backgroundColor:
          off && container !== 'transparent'
            ? withAlpha(c.onSurface, t.stateLayer.disabledContainer)
            : container,
        borderWidth: variant === 'outlined' ? t.borderWidth.hairline : 0,
        borderColor: off ? withAlpha(c.onSurface, t.stateLayer.disabledContainer) : c.outline,
        outlineStyle: focused ? 'solid' : undefined,
        outlineWidth: focused ? t.borderWidth.focus : 0,
        outlineColor: c.focusRing,
        outlineOffset: t.borderWidth.focusOffset,
      }}
    >
      {({ pressed }) => (
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: t.space[2],
            paddingHorizontal:
              variant === 'text' ? t.space[3] : size === 'lg' ? t.space[8] : t.space[6],
            backgroundColor: off
              ? 'transparent'
              : withAlpha(
                  content,
                  pressed
                    ? t.stateLayer.pressed
                    : focused
                      ? t.stateLayer.focus
                      : hovered
                        ? t.stateLayer.hover
                        : 0,
                ),
          }}
        >
          {loading ? <ActivityIndicator size="small" color={content} /> : icon}
          <Text
            variant={size === 'lg' ? 'titleMedium' : 'labelLarge'}
            numberOfLines={1}
            style={{ color: off ? withAlpha(c.onSurface, t.stateLayer.disabledContent) : content }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
