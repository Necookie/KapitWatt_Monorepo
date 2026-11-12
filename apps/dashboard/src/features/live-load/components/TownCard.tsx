import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { kw, percent, type TownTotals } from '@/utils/format';
import { Ring } from '@/components/Ring';
import { SIZE, STROKE } from '../utils/town-ring';
import type { PressState } from '@/utils/press-state';
import { motion } from '@/styles/motion';

/** One town: its ring, figures and a link to its barangays. */
export function TownCard({ town, measured }: { town: TownTotals; measured: boolean }) {
  const t = useTheme();
  const router = useRouter();
  const ring = useFocusVisible();
  const value = measured ? town.deliveredKw : town.committedKw;
  const share = town.targetKw > 0 ? value / town.targetKw : 0;
  const hit = share >= 1;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${town.town}: ${kw(Math.round(value))} of ${kw(town.targetKw)} kW, ${percent(value, town.targetKw)}`}
      onPress={() => router.push({ pathname: '/towns/[town]', params: { town: town.town } })}
      style={{ flex: 1, outlineWidth: 0 }}
    >
      {(s: PressState) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.space[3],
            padding: t.space[3],
            borderRadius: t.radius.md,
            backgroundColor:
              s.pressed || s.hovered
                ? withAlpha(
                    t.color.onSurface,
                    s.pressed ? t.stateLayer.pressed : t.stateLayer.hover,
                  )
                : t.color.surfaceContainerLow,
            ...(s.focused && ring
              ? {
                  outlineStyle: 'solid' as const,
                  outlineWidth: t.borderWidth.focus,
                  outlineColor: t.color.focusRing,
                }
              : null),
          }}
        >
          <View
            style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ring
              share={share}
              color={measured ? t.dataViz.delivered : t.dataViz.committed}
              track={t.color.surfaceContainerHighest}
              size={SIZE}
              stroke={STROKE}
            />
            <Text variant="labelMedium" style={{ fontVariant: ['tabular-nums'] }}>
              {percent(value, town.targetKw)}
            </Text>
            {/* Mounts when the town reaches its target, so it pops in at that moment. */}
            {hit ? (
              <View
                style={[
                  {
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 22,
                    height: 22,
                    borderRadius: t.radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: t.color.surfaceContainerLow,
                    backgroundColor: measured ? t.dataViz.delivered : t.dataViz.committed,
                  },
                  motion.pop,
                ]}
              >
                <Icon name="check" weight="bold" size="sm" color={t.color.onPrimary} />
              </View>
            ) : null}
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: t.space[0.5] }}>
            <Text variant="titleMedium" numberOfLines={1}>
              {town.town}
            </Text>
            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {kw(Math.round(value))} of {kw(town.targetKw)} kW
            </Text>
            {measured ? (
              <Text
                variant="bodySmall"
                color={town.barangaysHit > 0 ? 'onReliefContainer' : 'onSurfaceVariant'}
              >
                {town.barangaysHit} of {town.barangays.length} on target
              </Text>
            ) : hit ? (
              <Text variant="bodySmall" color="primary">
                Commitments cover the target
              </Text>
            ) : null}
          </View>
          <Icon name="chevronRight" size="sm" color="onSurfaceVariant" />
        </View>
      )}
    </Pressable>
  );
}
