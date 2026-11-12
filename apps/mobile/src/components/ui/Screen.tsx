import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '@/theme';

/**
 * Every screen's outer frame: scrolls, pads, and optionally supports pull to refresh.
 * The spinner shows only for a pull the user made, never for the background polling.
 */
export function Screen(props: { children: ReactNode; onRefresh?: () => Promise<unknown> }) {
  const insets = useSafeAreaInsets();
  const { onRefresh } = props;
  const [pulling, setPulling] = useState(false);
  return (
    <ScrollView
      style={styles.root}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingBottom: space.xl + insets.bottom }]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={pulling}
            onRefresh={() => {
              setPulling(true);
              void onRefresh().finally(() => setPulling(false));
            }}
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
