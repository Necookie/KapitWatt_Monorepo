import type { SimParams } from '@kapitwatt/shared';
import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { PRESETS, expectedOutcome, type PresetName } from '@kapitwatt/sim';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { Pressable, View } from 'react-native';
import { useLayoutValue } from '@/hooks/useLayoutValue';
import { fraction, kw, percent } from '@/utils/format';
import type { PressState } from '@/utils/press-state';

const NAMES: Record<PresetName, string> = { poor: 'Poor', typical: 'Typical', best: 'Best' };

/**
 * The plan's three participation presets as cards, each with what it would deliver for these
 * households and target, so they can be compared before one is picked. Picking sets participation
 * only; the other parameters stay as they are.
 */
export function ScenarioCards({
  params,
  households,
  targetKw,
  onPick,
}: {
  params: SimParams;
  households: number;
  targetKw: number;
  onPick: (participation: number) => void;
}) {
  const t = useTheme();
  const c = t.color;
  const ring = useFocusVisible();
  // Narrow: one compact row per preset instead of three tall cards.
  const [narrow, onLayout] = useLayoutValue((w) => w > 0 && w < 480);
  return (
    <View
      accessibilityRole="radiogroup"
      onLayout={onLayout}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[narrow ? 2 : 3] }}
    >
      {(Object.keys(PRESETS) as PresetName[]).map((name) => {
        const participation = PRESETS[name].participation;
        const on = params.participation === participation;
        const outcome = expectedOutcome(households, { ...params, participation });
        const fg = on ? c.onSecondaryContainer : c.onSurface;
        return (
          <Pressable
            key={name}
            accessibilityRole="radio"
            aria-checked={on}
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${NAMES[name]}, ${fraction(participation)} participation, about ${kw(Math.round(outcome.deliveredKw))} kW`}
            onPress={() => onPick(participation)}
            style={{ flexGrow: 1, flexBasis: narrow ? '100%' : 150, outlineWidth: 0 }}
          >
            {(s: PressState) => (
              <View
                style={{
                  flex: 1,
                  ...(narrow
                    ? {
                        flexDirection: 'row' as const,
                        alignItems: 'center' as const,
                        gap: t.space[3],
                      }
                    : { gap: t.space[1] }),
                  padding: narrow ? t.space[3] : t.space[4],
                  borderRadius: t.radius.md,
                  borderWidth: on ? 2 : t.borderWidth.hairline,
                  borderColor: on ? c.primary : c.outlineVariant,
                  backgroundColor: on
                    ? c.secondaryContainer
                    : s.pressed || s.hovered
                      ? withAlpha(
                          c.onSurface,
                          s.pressed ? t.stateLayer.pressed : t.stateLayer.hover,
                        )
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
                <View style={{ flex: narrow ? 1 : undefined, gap: t.space[1] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
                    <Text variant="titleMedium" style={{ color: fg, flex: 1 }}>
                      {NAMES[name]}
                    </Text>
                    {on && !narrow ? (
                      <Icon name="check" weight="bold" size="sm" color={fg} />
                    ) : null}
                  </View>
                  <Text variant="bodySmall" style={{ color: fg, opacity: 0.85 }}>
                    {fraction(participation)} of households commit
                  </Text>
                </View>
                {on && narrow ? <Icon name="check" weight="bold" size="sm" color={fg} /> : null}
                <Text
                  variant="titleSmall"
                  style={{ color: fg, marginTop: narrow ? 0 : t.space[1] }}
                >
                  ≈ {kw(Math.round(outcome.deliveredKw))} kW ·{' '}
                  {percent(outcome.deliveredKw, targetKw)}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
