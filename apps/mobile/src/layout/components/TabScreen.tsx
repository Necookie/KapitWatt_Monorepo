import { themes } from '@kapitwatt/styles';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui';
import { BAND_OVERLAP, NightBand } from './NightBand';

const c = themes.light.color;

/**
 * The frame of the four tabs, as onboarding: the night band on top, then the white sheet with the
 * tab's content (the shared Screen: scrolling, pull to refresh, fields kept above the keyboard).
 * The status bar is light while a tab is in front, and dark again when a white screen opens over it.
 */
export function TabScreen(props: {
  title: string;
  overline?: string;
  leading?: ReactNode;
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
      <NightBand title={props.title} overline={props.overline} leading={props.leading} />
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
  // The white sheet over the foot of the band, as on sign-up and login.
  sheet: {
    flex: 1,
    marginTop: -BAND_OVERLAP,
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
});
