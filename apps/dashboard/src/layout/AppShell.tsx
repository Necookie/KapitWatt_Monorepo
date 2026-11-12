import { useTheme, useWindowClass } from '@kapitwatt/hooks';
import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { BottomBar } from './components/BottomBar';
import { CompactTopBar } from './components/CompactTopBar';
import { Sidebar } from './components/Sidebar';
import { TopAppBar } from './components/TopAppBar';
import { useNavMotion } from './hooks/useNavMotion';
import { useSidebar } from './hooks/useSidebar';
import { CONTENT_MAX_WIDTH } from './utils/dimensions';

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTheme();
  const windowClass = useWindowClass();
  const drawerFits = windowClass !== 'compact' && windowClass !== 'medium';
  const nav = useSidebar(drawerFits);
  const motion = useNavMotion();
  const layout = windowClass === 'compact' ? 'bar' : 'side';
  // Set by the window, not the sidebar state, so toggling never changes the page's padding.
  const gutter = layout === 'bar' ? t.space[4] : drawerFits ? t.space[8] : t.space[6];
  const pane = (
    <View
      style={{
        flex: 1,
        overflow: 'hidden',
        backgroundColor: t.color.surface,
        borderTopLeftRadius: t.radius.xl,
        borderTopRightRadius: layout === 'bar' ? t.radius.xl : 0,
      }}
    >
      <ScrollView contentContainerStyle={{ padding: gutter }}>
        <View
          style={{
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: 'center',
            gap: t.space[4],
          }}
        >
          {children}
        </View>
      </ScrollView>
    </View>
  );

  if (layout === 'bar') {
    return (
      <View style={{ flex: 1, backgroundColor: t.color.surfaceContainer }}>
        <CompactTopBar />
        {pane}
        <BottomBar />
      </View>
    );
  }
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        overflow: 'hidden',
        backgroundColor: t.color.surfaceContainer,
      }}
    >
      <Sidebar collapsed={nav.collapsed} visible={nav.width} onToggle={nav.toggle} />
      {/* Reserves the sidebar's width; the sidebar itself is drawn over it, clipped to match. */}
      <View style={[{ width: nav.width }, motion.size('width')]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <TopAppBar gutter={gutter} />
        {pane}
      </View>
    </View>
  );
}
