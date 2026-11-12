import type { AlertLevel } from '@kapitwatt/shared';
import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { Pressable, View } from 'react-native';
import { kw } from '@/utils/format';
import { LEVELS } from '../utils/levels';
import type { PressState } from '@/utils/press-state';
import { motion } from '@/styles/motion';

/**
 * The NGCP alert level as two large cards. The selected one fills with its alert colour; red and
 * yellow mean the NGCP alert and nothing else. Words and a check mark carry the choice too.
 */
export function LevelCards({
  value,
  onChange,
  defaultTargetKw,
}: {
  value: AlertLevel;
  onChange: (level: AlertLevel) => void;
  defaultTargetKw: Record<AlertLevel, number>;
}) {
  const t = useTheme();
  const c = t.color;
  const ring = useFocusVisible();
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}
    >
      {LEVELS.map(({ level, name, meaning }) => {
        const on = value === level;
        const red = level === 'red';
        const [bg, fg] = on
          ? red
            ? [c.alertRed, c.onAlertRed]
            : [c.alertYellow, c.onAlertYellow]
          : red
            ? [c.alertRedContainer, c.onAlertRedContainer]
            : [c.alertYellowContainer, c.onAlertYellowContainer];
        return (
          <Pressable
            key={level}
            accessibilityRole="radio"
            accessibilityLabel={`${name}. ${meaning}`}
            accessibilityState={{ checked: on }}
            aria-checked={on}
            onPress={() => onChange(level)}
            style={{ flexGrow: 1, flexBasis: 220, outlineWidth: 0 }}
          >
            {(s: PressState) => (
              <View
                style={{
                  flex: 1,
                  gap: t.space[2],
                  padding: t.space[4],
                  borderRadius: t.radius.lg,
                  backgroundColor: bg,
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
                {/* Hover and press wash over the card's own colour. */}
                {s.hovered || s.pressed ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: t.radius.lg,
                      backgroundColor: withAlpha(
                        fg,
                        s.pressed ? t.stateLayer.pressed : t.stateLayer.hover,
                      ),
                    }}
                  />
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
                  <Icon name="alert" weight="fill" color={fg} />
                  <Text variant="titleMedium" style={{ color: fg, flex: 1 }}>
                    {name}
                  </Text>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: on ? 0 : 1.5,
                      borderColor: withAlpha(fg, 0.6),
                      backgroundColor: on ? withAlpha(fg, 0.18) : 'transparent',
                    }}
                  >
                    {on ? (
                      <View style={motion.pop}>
                        <Icon name="check" weight="bold" size="sm" color={fg} />
                      </View>
                    ) : null}
                  </View>
                </View>
                <Text variant="bodyMedium" style={{ color: fg }}>
                  {meaning}
                </Text>
                <Text variant="labelMedium" style={{ color: fg, opacity: 0.85, marginTop: 'auto' }}>
                  Default target {kw(defaultTargetKw[level])} kW
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
