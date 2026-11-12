import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

const c = themes.light.color;

/**
 * The sky in flat tonal steps (no gradients, DESIGN.md): a deep night over Grid Indigo, and the town's
 * glow rising from behind the horizon as stacked arcs of the primary role, each step lighter towards
 * the street. Each arc: its radius as a share of the screen height.
 */
const NIGHT = 0.5;
const GLOW = [1.05, 0.8, 0.58] as const;
const GLOW_STRENGTH = 0.16;
/** Where the glow rises from: the horizon behind the street, as a share of the screen height. */
const HORIZON = 0.86;

/** A scatter of small stars in the upper sky: x, y (shares of the screen) and size. */
const STARS = [
  [0.07, 0.07, 2],
  [0.22, 0.13, 1.5],
  [0.36, 0.05, 2.5],
  [0.52, 0.11, 1.5],
  [0.64, 0.04, 2],
  [0.79, 0.12, 1.5],
  [0.93, 0.08, 2.5],
  [0.14, 0.24, 1.5],
  [0.44, 0.2, 2],
  [0.71, 0.22, 1.5],
  [0.88, 0.27, 2],
  [0.05, 0.36, 1.5],
  [0.3, 0.33, 1.5],
  [0.96, 0.4, 1.5],
] as const;

/** Behind the whole welcome screen: the night sky, the town's glow and the stars. Decorative. */
export function NightSky() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.night]} aria-hidden>
      {GLOW.map((share) => {
        const r = height * share;
        return (
          <View
            key={share}
            style={{
              position: 'absolute',
              left: width / 2 - r,
              top: height * HORIZON - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              backgroundColor: withAlpha(c.primary, GLOW_STRENGTH),
            }}
          />
        );
      })}
      {STARS.map(([x, y, size], i) => (
        <View
          key={`s${i}`}
          style={{
            position: 'absolute',
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: withAlpha(c.primaryContainer, 0.75),
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  night: { overflow: 'hidden', backgroundColor: withAlpha(c.onPrimaryContainer, NIGHT) },
});
