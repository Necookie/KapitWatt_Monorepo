import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '@/styles/theme';

/**
 * Every screen's outer frame: scrolls, pads, and optionally supports pull to refresh.
 * The spinner shows only for a pull the user made, never for the background polling.
 * The content fills at least the screen, so a block with `marginTop: 'auto'` sits at the bottom.
 */
export function Screen(props: {
  children: ReactNode;
  onRefresh?: () => Promise<unknown>;
  /** 24 px sides and a 24 px gap, for screens with few, large blocks (welcome, log in). */
  roomy?: boolean;
  /** No top bar above this screen: pad for the status bar and leave room at the top. */
  noHeader?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { onRefresh } = props;
  const [pulling, setPulling] = useState(false);
  return (
    <ScrollView
      style={styles.root}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        props.roomy && styles.roomy,
        props.noHeader && { paddingTop: insets.top + space.xxl },
        { paddingBottom: space.xl + insets.bottom },
      ]}
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
  content: { flexGrow: 1, padding: space.lg, gap: space.lg },
  roomy: { paddingHorizontal: space.xl, paddingTop: space.sm, gap: space.xl },
});
