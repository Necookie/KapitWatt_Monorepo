import { themes } from '@kapitwatt/styles';
import { space, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skyline } from '@/components/night/Skyline';
import { GridStatus } from './GridStatus';

const c = themes.light.color;
const ON_SOFT = withAlpha(c.onBrand, 0.78);
/** How far the white sheet below covers the foot of the band (px). */
export const BAND_OVERLAP = 20;
/** Room under the grid status for the street's rooftops and lit windows (px). */
const STREET_ROOM = 56;

/** A few stars in the band's sky: x, y (shares of the band) and size. */
const STARS = [
  [0.08, 0.3, 2],
  [0.3, 0.18, 1.5],
  [0.55, 0.26, 2],
  [0.78, 0.14, 1.5],
  [0.92, 0.34, 2],
] as const;

/**
 * The top of every tab: onboarding's night carries on as a short band, the street (its windows lit)
 * at its foot, the tab's title over it and the grid's state under the title. `leading` sits before
 * the title (Profile's initials). Flat tones only (DESIGN.md).
 */
export function NightBand(props: { overline?: string; title: string; leading?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // The street's windows stay lit here (0 = no cut).
  const lit = useRef(new Animated.Value(0)).current;
  return (
    <View style={[styles.band, { paddingTop: insets.top + space[4] }]}>
      <View style={styles.night} />
      {STARS.map(([x, y, size], i) => (
        <View
          key={i}
          style={[
            styles.star,
            { left: `${x * 100}%`, top: `${y * 100}%`, width: size, height: size },
          ]}
        />
      ))}
      <View pointerEvents="none" style={styles.street}>
        <Skyline cut={lit} width={width} />
      </View>

      <View style={styles.row}>
        {props.leading}
        <View style={styles.words}>
          {props.overline ? (
            <Text variant="bodyMedium" numberOfLines={1} style={{ color: ON_SOFT }}>
              {props.overline}
            </Text>
          ) : null}
          <Text
            variant="headlineSmall"
            accessibilityRole="header"
            numberOfLines={1}
            style={{ color: c.onBrand }}
          >
            {props.title}
          </Text>
        </View>
      </View>
      <GridStatus />
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: c.brand,
    overflow: 'hidden',
    paddingHorizontal: space[6],
    paddingBottom: BAND_OVERLAP + STREET_ROOM,
    gap: space[3],
  },
  night: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: withAlpha(c.onPrimaryContainer, 0.5),
  },
  star: {
    position: 'absolute',
    borderRadius: 1,
    backgroundColor: withAlpha(c.primaryContainer, 0.75),
  },
  // The street stands on the sheet's edge (not under it), so whole rooftops and windows show.
  street: { position: 'absolute', left: 0, right: 0, bottom: BAND_OVERLAP },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  words: { flex: 1, gap: 2 },
});
