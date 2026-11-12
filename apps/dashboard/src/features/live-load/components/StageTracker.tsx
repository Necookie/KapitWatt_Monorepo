import type { AlertStatus } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { color as roles, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { ON, ON_SOFT } from '@/styles/on-brand';
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
              <View
                style={{
                  width: 24,
                  height: 2,
                  marginHorizontal: t.space[2],
                  backgroundColor: i <= current ? t.color.inversePrimary : withAlpha(ON, 0.24),
                }}
              />
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? t.color.inversePrimary : now ? ON : 'transparent',
                  borderWidth: done || now ? 0 : 1.5,
                  borderColor: withAlpha(ON, 0.5),
                }}
              >
                {done ? (
                  <Icon name="check" weight="bold" size="sm" color={roles.light.brand} />
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
