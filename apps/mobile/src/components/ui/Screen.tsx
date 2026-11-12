import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '@/theme';

/** Every screen's outer frame: scrolls, pads, and optionally supports pull to refresh. */
export function Screen(props: {
  children: ReactNode;
  onRefresh?: () => Promise<unknown>;
  refreshing?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { onRefresh } = props;
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: space.xl + insets.bottom }]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={props.refreshing ?? false}
            onRefresh={() => void onRefresh()}
            tintColor={colors.teal}
            colors={[colors.teal]}
          />
        ) : undefined
      }
    >
      {props.children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.lg },
});
