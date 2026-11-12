import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Pressable, View } from 'react-native';
import type { PressState } from '@/utils/press-state';
import { useNavMotion } from '../hooks/useNavMotion';
import { DRAWER_WIDTH, NAV_INSET, RAIL_WIDTH } from '../utils/dimensions';
import { NO_NATIVE_OUTLINE, focusRing, wash } from '../utils/interaction';

/**
 * Collapse or expand, in the logo row: at the row's end when expanded, in the rail's column when
 * collapsed (where the lockup has faded). It slides between the two with a transform (no layout).
 */
export function SidebarToggle({ collapsed, onPress }: { collapsed: boolean; onPress: () => void }) {
  const t = useTheme();
  const ring = useFocusVisible();
  const motion = useNavMotion();
  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  // Row-relative: the rail's centre column, or the drawer row's end.
  const left = (RAIL_WIDTH - t.size.controlMd) / 2 - NAV_INSET;
  const travel = DRAWER_WIDTH - NAV_INSET * 2 - t.size.controlMd - left;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: !collapsed }}
      onPress={onPress}
      style={[
        NO_NATIVE_OUTLINE,
        { position: 'absolute', left, transform: [{ translateX: collapsed ? 0 : travel }] },
        motion.size('transform'),
      ]}
    >
      {(s: PressState) => (
        <View
          style={[
            {
              width: t.size.controlMd,
              height: t.size.controlMd,
              borderRadius: t.radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: wash(t, t.color.onSurface, s),
            },
            focusRing(t, s, ring),
          ]}
        >
          <Icon name="sidebar" color="onSurfaceVariant" />
        </View>
      )}
    </Pressable>
  );
}
