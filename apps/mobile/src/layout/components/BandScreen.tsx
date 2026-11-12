import { themes } from '@kapitwatt/styles';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui';
import { BAND_OVERLAP, NightBand } from './NightBand';

const c = themes.light.color;

/**
 * A screen opened over the tabs (the event, committing a cut) in the same frame as the tabs: the
 * night band with a back arrow and the screen's own header (`band`), then the white sheet. `cut`
 * dims the band's street. The status bar is light while it is in front.
 */
export function BandScreen(props: {
  band: ReactNode;
  cut?: Animated.Value;
  onRefresh?: () => Promise<unknown>;
  children: ReactNode;
}) {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );
  return (
    <View style={styles.root}>
      <NightBand status={false} cut={props.cut} onBack={() => router.back()}>
        {props.band}
      </NightBand>
      <View style={styles.sheet}>
        <Screen roomy onRefresh={props.onRefresh}>
          {props.children}
        </Screen>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.brand },
  sheet: {
    flex: 1,
    marginTop: -BAND_OVERLAP,
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
});
