import { useTheme } from '@kapitwatt/hooks';
import { withAlpha } from '@kapitwatt/tokens';
import { Pressable, View } from 'react-native';
import { Text } from './Text';

export type Segment<V extends string> = { value: V; label: string; disabled?: boolean };

/**
 * Pick one of 2 to 5 options: commit presets (0.5, 1, 1.5, 2 kW), alert level, window presets.
 * Selected segment uses secondaryContainer and a check mark so the choice is not colour-only.
 */
export function SegmentedButtons<V extends string>({
  segments,
  value,
  onChange,
  size = 'md',
  accessibilityLabel,
}: {
  segments: Segment<V>[];
  value: V;
  onChange: (value: V) => void;
  size?: 'md' | 'lg';
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const c = t.color;
  const height = size === 'lg' ? t.size.touchTarget : t.size.controlMd;
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        alignSelf: 'stretch',
        borderRadius: t.radius.full,
        borderWidth: t.borderWidth.hairline,
        borderColor: c.outline,
        overflow: 'hidden',
      }}
    >
      {segments.map((s, i) => {
        const selected = s.value === value;
        return (
          <Pressable
            key={s.value}
            disabled={s.disabled}
            onPress={() => onChange(s.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled: !!s.disabled }}
            style={({ pressed }) => ({
              flex: 1,
              height,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: t.space[1],
              backgroundColor: selected
                ? c.secondaryContainer
                : pressed
                  ? withAlpha(c.onSurface, t.stateLayer.pressed)
                  : 'transparent',
              borderLeftWidth: i === 0 ? 0 : t.borderWidth.hairline,
              borderColor: c.outline,
            })}
          >
            {selected ? (
              <Text variant="labelLarge" style={{ color: c.onSecondaryContainer }}>
                ✓
              </Text>
            ) : null}
            <Text
              variant="labelLarge"
              numberOfLines={1}
              style={{
                color: s.disabled
                  ? withAlpha(c.onSurface, t.stateLayer.disabledContent)
                  : selected
                    ? c.onSecondaryContainer
                    : c.onSurface,
              }}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
