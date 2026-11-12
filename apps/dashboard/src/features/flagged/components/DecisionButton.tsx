import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon, type IconName } from '@kapitwatt/icons';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { PressState } from '@/utils/press-state';

/** Approve (relief) or reject (outlined); the keyboard letter is shown so the shortcut is found. */
export function DecisionButton({
  label,
  hint,
  icon,
  tone,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  hint: string;
  icon: IconName;
  tone: 'approve' | 'reject';
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const c = t.color;
  const ring = useFocusVisible();
  const filled = tone === 'approve';
  const fg = filled ? c.onRelief : c.onSurface;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={{ outlineWidth: 0 }}
    >
      {(s: PressState) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.space[2],
            height: t.size.controlMd + 8,
            paddingHorizontal: t.space[5],
            borderRadius: t.radius.full,
            borderWidth: filled ? 0 : t.borderWidth.hairline,
            borderColor: c.outline,
            backgroundColor: filled ? c.relief : 'transparent',
            opacity: disabled && !busy ? 0.5 : 1,
            ...(s.focused && ring
              ? {
                  outlineStyle: 'solid' as const,
                  outlineWidth: t.borderWidth.focus,
                  outlineColor: c.focusRing,
                  outlineOffset: t.borderWidth.focusOffset,
                }
              : null),
          }}
        >
          {s.hovered || s.pressed ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: t.radius.full,
                backgroundColor: withAlpha(
                  fg,
                  s.pressed ? t.stateLayer.pressed : t.stateLayer.hover,
                ),
              }}
            />
          ) : null}
          {busy ? (
            <ActivityIndicator size="small" color={fg} />
          ) : (
            <Icon name={icon} size="sm" color={fg} />
          )}
          <Text variant="labelLarge" style={{ color: fg }}>
            {label}
          </Text>
          <View
            style={{
              paddingHorizontal: t.space[1],
              borderRadius: t.radius.xs,
              backgroundColor: withAlpha(fg, 0.14),
            }}
          >
            <Text variant="labelSmall" style={{ color: fg }}>
              {hint}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}
