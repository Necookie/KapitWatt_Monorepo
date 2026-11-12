import type { AlertStatus } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { duration, color as roles, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { ON, ON_SOFT } from '@/styles/on-brand';
import { motion, transition } from '@/styles/motion';
import { STAGES, stageIndex } from '../utils/stages';

export function StageTracker({ status }: { status: AlertStatus }) {
  const t = useTheme();
  const current = stageIndex(status);
  return (
    <View
      accessibilityRole={'list' as never}
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: t.space[2] }}
    >
      {STAGES.map((name, i) => {
        const done = i < current || status === 'settled';
        const now = i === current && status !== 'settled';
        return (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {i > 0 ? (
              // The connector fills left to right as its stage is reached.
              <View
                style={{
                  width: 24,
                  height: 2,
                  marginHorizontal: t.space[2],
                  backgroundColor: withAlpha(ON, 0.24),
                }}
              >
                <View
                  style={[
                    {
                      height: 2,
                      backgroundColor: t.color.inversePrimary,
                      transformOrigin: 'left',
                      transform: [{ scaleX: i <= current ? 1 : 0 }],
                    },
                    transition('transform', duration.long2),
                  ]}
                />
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
              <View
                style={[
                  {
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: done ? t.color.inversePrimary : now ? ON : 'transparent',
                    borderWidth: done || now ? 0 : 1.5,
                    borderColor: withAlpha(ON, 0.5),
                  },
                  transition('background-color'),
                ]}
              >
                {/* The stage in progress keeps a soft ring growing out of it. */}
                {now ? (
                  <View
                    style={[
                      {
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: ON,
                      },
                      motion.ping,
                    ]}
                  />
                ) : null}
                {done ? (
                  <View key="done" style={motion.pop}>
                    <Icon name="check" weight="bold" size="sm" color={roles.light.brand} />
                  </View>
                ) : (
                  <Text variant="labelSmall" style={{ color: now ? roles.light.brand : ON_SOFT }}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text variant="labelLarge" style={{ color: done || now ? ON : ON_SOFT }}>
                {name}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
