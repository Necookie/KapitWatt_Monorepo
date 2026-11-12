import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Logo, Text } from '@kapitwatt/ui';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { DataSource } from './DataSource';
import { NavItem } from './NavItem';
import { SidebarToggle } from './SidebarToggle';
import { SimulatedChip } from './SimulatedChip';
import { SimulatedPill } from './SimulatedPill';
import { useNavMotion } from '../hooks/useNavMotion';
import {
  BAR_HEIGHT,
  DRAWER_WIDTH,
  ITEM_COLLAPSED,
  ITEM_WIDTH,
  NAV_INSET,
} from '../utils/dimensions';
import { SECTIONS } from '../utils/navigation';

/**
 * The sidebar: drawer at 280, rail at 80, one component. Only the width moves (a CSS transition); its
 * contents are laid out at drawer width throughout and clipped, so icons stay put and nothing swaps.
 * `onToggle` is left out where the window only fits the rail (medium).
 */
export function Sidebar({
  collapsed,
  visible,
  onToggle,
}: {
  /** Contents: labels shown or faded, highlights full or pills. */
  collapsed: boolean;
  /** How much of the 280 shows; the rest is clipped (clip-path animates without layout). */
  visible: number;
  onToggle?: (next: boolean) => void;
}) {
  const t = useTheme();
  const motion = useNavMotion();
  return (
    <View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          zIndex: 1,
          backgroundColor: t.color.surfaceContainer,
          clipPath: `inset(0 ${DRAWER_WIDTH - visible}px 0 0)`,
        } as unknown as ViewStyle,
        motion.size('clip-path'),
      ]}
    >
      {/* Scrolls on short windows; the pilot card sits at its foot. */}
      <ScrollView
        style={{ width: DRAWER_WIDTH, flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: NAV_INSET,
          paddingBottom: t.space[5],
          gap: t.space[4],
        }}
      >
        {/* The lockup fades in the rail, where the toggle carries the mark. */}
        <View style={{ height: BAR_HEIGHT, justifyContent: 'center', paddingLeft: t.space[4] }}>
          <View style={motion.fade(!collapsed)}>
            <Logo height={26} />
          </View>
          {onToggle ? (
            <SidebarToggle collapsed={collapsed} onPress={() => onToggle(!collapsed)} />
          ) : (
            <View
              pointerEvents="none"
              style={[{ position: 'absolute', left: t.space[4] }, motion.fade(collapsed)]}
            >
              <Logo variant="mark" height={26} />
            </View>
          )}
        </View>

        <View accessibilityRole="menu" style={{ gap: t.space[6] }}>
          {SECTIONS.map((section) => (
            <View key={section.title} style={{ gap: t.space[1] }}>
              <Text
                variant="labelMedium"
                color="onSurfaceVariant"
                numberOfLines={1}
                style={[
                  {
                    paddingHorizontal: t.space[4],
                    paddingBottom: t.space[2],
                    textTransform: 'uppercase',
                  },
                  motion.fade(!collapsed),
                ]}
              >
                {section.title}
              </Text>
              {section.items.map((item) => (
                <NavItem key={item.href} item={item} collapsed={collapsed} />
              ))}
            </View>
          ))}
        </View>

        <View style={{ marginTop: 'auto', gap: t.space[3] }}>
          <View>
            <View
              style={[
                {
                  width: ITEM_WIDTH,
                  gap: t.space[2],
                  padding: t.space[4],
                  borderRadius: t.radius.lg,
                  backgroundColor: t.color.surfaceContainerHigh,
                },
                motion.fade(!collapsed),
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
                <Icon name="location" size="sm" color="onSurfaceVariant" />
                <Text variant="titleSmall">Laguna pilot</Text>
              </View>
              <Text variant="bodySmall" color="onSurfaceVariant">
                7 towns · 21 barangays
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
                <DataSource />
                <SimulatedChip />
              </View>
            </View>
            {/* Collapsed, the card gives way to the Simulated pill in the rail's column. */}
            <View
              pointerEvents="none"
              style={[
                { position: 'absolute', left: (ITEM_COLLAPSED - 40) / 2, bottom: 0 },
                motion.fade(collapsed),
              ]}
            >
              <SimulatedPill />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
