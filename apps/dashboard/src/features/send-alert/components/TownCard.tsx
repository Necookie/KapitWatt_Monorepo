import type { BarangayWithCount } from '@kapitwatt/shared';
import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { Pressable, View } from 'react-native';
import { ChoiceChip } from '@/components/ChoiceChip';
import { approx } from '../utils/barangays';
import type { PressState } from '@/utils/press-state';

/** A town as one row: tap its name for the whole town, or its barangays one by one. */
export function TownCard({
  town,
  list,
  selected,
  onToggle,
}: {
  town: string;
  list: BarangayWithCount[];
  selected: Set<string>;
  onToggle: (ids: string[], on: boolean) => void;
}) {
  const t = useTheme();
  const c = t.color;
  const ring = useFocusVisible();
  const on = list.filter((b) => selected.has(b.id)).length;
  const all = on === list.length;
  const some = on > 0 && !all;
  const known = list.some((b) => b.optedInHouseholds !== undefined);
  const households = list.reduce((sum, b) => sum + (b.optedInHouseholds ?? 0), 0);
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: t.space[3],
        paddingHorizontal: t.space[3],
        paddingVertical: t.space[2],
        borderRadius: t.radius.md,
        borderWidth: all ? 2 : t.borderWidth.hairline,
        borderColor: all ? c.primary : c.outlineVariant,
        backgroundColor: on > 0 ? c.surfaceContainerLowest : c.surfaceContainerLow,
      }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${town}, ${on} of ${list.length} barangays`}
        accessibilityState={{ checked: all ? true : some ? 'mixed' : false }}
        aria-checked={all ? true : some ? 'mixed' : false}
        onPress={() =>
          onToggle(
            list.map((b) => b.id),
            !all,
          )
        }
        style={{ width: 200, outlineWidth: 0 }}
      >
        {(s: PressState) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.space[2],
              margin: -t.space[1],
              padding: t.space[1],
              borderRadius: t.radius.sm,
              backgroundColor:
                s.pressed || s.hovered
                  ? withAlpha(c.onSurface, s.pressed ? t.stateLayer.pressed : t.stateLayer.hover)
                  : 'transparent',
              ...(s.focused && ring
                ? {
                    outlineStyle: 'solid' as const,
                    outlineWidth: t.borderWidth.focus,
                    outlineColor: c.focusRing,
                  }
                : null),
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: t.radius.xs,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: all || some ? 0 : 1.5,
                borderColor: c.onSurfaceVariant,
                backgroundColor: all || some ? c.primary : 'transparent',
              }}
            >
              {all ? <Icon name="check" weight="bold" size="sm" color="onPrimary" /> : null}
              {some ? <Icon name="remove" weight="bold" size="sm" color="onPrimary" /> : null}
            </View>
            <Text variant="titleSmall" style={{ flex: 1 }} numberOfLines={1}>
              {town}
            </Text>
            <Text variant="labelMedium" color="onSurfaceVariant">
              {known ? approx(households) : `${list.length} brgy`}
            </Text>
          </View>
        )}
      </Pressable>
      <View
        style={{ flex: 1, minWidth: 220, flexDirection: 'row', flexWrap: 'wrap', gap: t.space[1] }}
      >
        {list.map((b) => (
          <ChoiceChip
            key={b.id}
            label={b.name}
            selected={selected.has(b.id)}
            onPress={() => onToggle([b.id], !selected.has(b.id))}
          />
        ))}
      </View>
    </View>
  );
}
