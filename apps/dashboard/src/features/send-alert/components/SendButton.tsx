import type { AlertLevel } from '@kapitwatt/shared';
import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { PressState } from '@/utils/press-state';

/** The send action in the alert's own colour; red and yellow mean the NGCP alert. */
export function SendButton({
  level,
  label,
  disabled = false,
  busy = false,
  size = 'lg',
  onPress,
}: {
  level: AlertLevel;
  label: string;
  /** lg: the rail's main action. md: inside the dialog, beside Cancel. */
  size?: 'md' | 'lg';
  disabled?: boolean;
  busy?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const c = t.color;
  const ring = useFocusVisible();
  const [bg, fg] = level === 'red' ? [c.alertRed, c.onAlertRed] : [c.alertYellow, c.onAlertYellow];
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={{ outlineWidth: 0 }}
    >
      {(s: PressState) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: t.space[2],
            height: size === 'lg' ? t.size.controlLg : t.size.controlMd,
            paddingHorizontal: size === 'lg' ? t.space[6] : t.space[5],
            borderRadius: t.radius.full,
            backgroundColor: off ? withAlpha(c.onSurface, 0.12) : bg,
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
          {!off && (s.hovered || s.pressed) ? (
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
            <Icon name="send" size="sm" color={off ? withAlpha(c.onSurface, 0.38) : fg} />
          )}
          <Text
            variant={size === 'lg' ? 'titleSmall' : 'labelLarge'}
            style={{ color: off ? withAlpha(c.onSurface, 0.38) : fg }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
