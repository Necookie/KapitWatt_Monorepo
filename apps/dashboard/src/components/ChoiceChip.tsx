import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { Pressable, View } from 'react-native';
import type { PressState } from '@/utils/press-state';

/** M3 filter chip: a choice the operator taps. Selected shows a check, so it is not colour-only. */
export function ChoiceChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const c = t.color;
  const ring = useFocusVisible();
  const fg = selected ? c.onSecondaryContainer : c.onSurfaceVariant;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ outlineWidth: 0 }}
    >
      {(s: PressState) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.space[1],
            height: t.size.controlSm,
            paddingLeft: selected ? t.space[2] : t.space[3],
            paddingRight: t.space[3],
            borderRadius: t.radius.sm,
            borderWidth: selected ? 0 : t.borderWidth.hairline,
            borderColor: c.outline,
            backgroundColor: selected
              ? c.secondaryContainer
              : s.pressed || s.hovered
                ? withAlpha(c.onSurface, s.pressed ? t.stateLayer.pressed : t.stateLayer.hover)
                : 'transparent',
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
          {selected ? <Icon name="check" size="sm" color={fg} /> : null}
          <Text variant="labelLarge" style={{ color: fg }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
