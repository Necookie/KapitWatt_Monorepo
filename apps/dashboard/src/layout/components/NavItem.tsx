import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import type { PressState } from '@/utils/press-state';
import { LaterTag } from './LaterTag';
import { useActive } from '../hooks/useActive';
import { useNavMotion } from '../hooks/useNavMotion';
import { DRAWER_ITEM_HEIGHT, ITEM_COLLAPSED, ITEM_WIDTH } from '../utils/dimensions';
import { NO_NATIVE_OUTLINE, currentPage, focusRing, wash } from '../utils/interaction';
import { type Destination } from '../utils/navigation';

/**
 * A destination. Its icon never moves; the highlight narrows to a pill round the icon and the label
 * fades, clipped by the sidebar's edge. The label keeps a fixed width so nothing reflows mid-animation.
 */
export function NavItem({ item, collapsed }: { item: Destination; collapsed: boolean }) {
  const t = useTheme();
  const ring = useFocusVisible();
  const active = useActive(item);
  const motion = useNavMotion();
  const fg = active ? t.color.onSecondaryContainer : t.color.onSurfaceVariant;
  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        {...currentPage(active)}
        style={NO_NATIVE_OUTLINE}
      >
        {(s: PressState) => (
          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.space[3],
                width: collapsed ? ITEM_COLLAPSED : ITEM_WIDTH,
                height: DRAWER_ITEM_HEIGHT,
                paddingLeft: t.space[4],
                borderRadius: t.radius.full,
                overflow: 'hidden',
                backgroundColor: active
                  ? t.color.secondaryContainer
                  : wash(t, t.color.onSurface, s),
              },
              motion.size('width'),
              focusRing(t, s, ring),
            ]}
          >
            {/* Neither shrinks: the pill clips them instead, so the icon never moves. */}
            <View style={{ flexShrink: 0 }}>
              <Icon name={item.icon} weight={active ? 'fill' : 'regular'} color={fg} />
            </View>
            <View
              style={[
                {
                  flexShrink: 0,
                  width: ITEM_WIDTH - t.space[4] * 2 - t.size.icon - t.space[3],
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: t.space[2],
                },
                motion.fade(!collapsed),
              ]}
            >
              <Text variant="labelLarge" style={{ color: fg, flex: 1 }} numberOfLines={1}>
                {item.label}
              </Text>
              {item.later ? <LaterTag /> : null}
            </View>
          </View>
        )}
      </Pressable>
    </Link>
  );
}
