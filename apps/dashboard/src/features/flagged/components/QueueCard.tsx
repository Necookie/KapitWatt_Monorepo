import type { FlaggedReading } from '@kapitwatt/shared';
import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { withAlpha } from '@kapitwatt/tokens';
import { Chip, Text } from '@kapitwatt/ui';
import { Pressable, View } from 'react-native';
import { clock } from '@/utils/format';
import { FLAG_LABEL, KIND_LABEL } from '../utils/checks';
import type { PressState } from '@/utils/press-state';

export function QueueCard({
  reading: r,
  selected,
  onPress,
}: {
  reading: FlaggedReading;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const c = t.color;
  const ring = useFocusVisible();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${r.barangayName}, ${r.municipality}. ${KIND_LABEL[r.kind]} photo at ${clock(r.capturedAt)}. ${r.flags.map((f) => FLAG_LABEL[f]).join(', ')}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ outlineWidth: 0 }}
    >
      {(s: PressState) => (
        <View
          style={{
            gap: t.space[2],
            padding: t.space[3],
            borderRadius: t.radius.md,
            borderWidth: selected ? 2 : t.borderWidth.hairline,
            borderColor: selected ? c.primary : c.outlineVariant,
            backgroundColor: selected
              ? c.secondaryContainer
              : s.pressed || s.hovered
                ? withAlpha(c.onSurface, s.pressed ? t.stateLayer.pressed : t.stateLayer.hover)
                : c.surfaceContainerLowest,
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
            <Text variant="titleSmall" style={{ flex: 1 }} numberOfLines={1}>
              {r.barangayName}, {r.municipality}
            </Text>
            <Icon name="chevronRight" size="sm" color="onSurfaceVariant" />
          </View>
          <Text variant="bodySmall" color="onSurfaceVariant">
            {KIND_LABEL[r.kind]} photo · {clock(r.capturedAt)}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[1] }}>
            {r.flags.map((flag) => (
              <Chip key={flag} label={FLAG_LABEL[flag]} tone="alertYellow" />
            ))}
          </View>
        </View>
      )}
    </Pressable>
  );
}
