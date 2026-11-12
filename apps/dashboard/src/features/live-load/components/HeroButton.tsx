import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon, type IconName } from '@kapitwatt/icons';
import { color as roles, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { ON } from '@/styles/on-brand';

/** Pill button for the indigo hero: outlined white, or filled white with brand text. */
export function HeroButton({
  label,
  icon,
  filled = false,
  busy = false,
  disabled = false,
  onPress,
}: {
  label: string;
  icon?: IconName;
  filled?: boolean;
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const ring = useFocusVisible();
  const fg = filled ? roles.light.brand : ON;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={{ outlineWidth: 0 }}
    >
      {(s: { pressed: boolean; hovered?: boolean; focused?: boolean }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.space[1],
            height: t.size.controlSm + 4,
            paddingHorizontal: t.space[4],
            borderRadius: t.radius.full,
            borderWidth: filled ? 0 : 1,
            borderColor: withAlpha(ON, 0.6),
            backgroundColor: filled
              ? ON
              : s.pressed || s.hovered
                ? withAlpha(ON, s.pressed ? 0.16 : 0.1)
                : 'transparent',
            opacity: disabled ? 0.5 : 1,
            ...(s.focused && ring
              ? {
                  outlineStyle: 'solid' as const,
                  outlineWidth: t.borderWidth.focus,
                  outlineColor: ON,
                  outlineOffset: t.borderWidth.focusOffset,
                }
              : null),
          }}
        >
          {busy ? (
            <ActivityIndicator size="small" color={fg} />
          ) : icon ? (
            <Icon name={icon} size="sm" color={fg} />
          ) : null}
          <Text variant="labelLarge" style={{ color: fg }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
