import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { useEffect, useMemo } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const c = themes.light.color;
const NATIVE = Platform.OS !== 'web';

/** Where the fireflies sit (fractions of the sky) and how they move: fixed, so the sky never jumps. */
// Kept to the edges and the lower sky, clear of the headline and the line under the mascot.
const FLIES = [
  [0.05, 0.08, 5, 3200],
  [0.93, 0.05, 6, 3600],
  [0.08, 0.34, 4, 4100],
  [0.9, 0.3, 4, 2900],
  [0.04, 0.55, 5, 3800],
  [0.95, 0.5, 5, 4400],
  [0.18, 0.46, 3, 4700],
  [0.8, 0.44, 3, 3300],
  [0.1, 0.86, 5, 3500],
  [0.92, 0.8, 4, 3000],
  [0.3, 0.92, 3, 4200],
  [0.7, 0.9, 3, 3900],
] as const;

/** Small orange lights drifting and twinkling over the night sky. Decorative; still under reduced motion. */
export function Fireflies() {
  const reduced = useReducedMotion();
  const waves = useMemo(() => FLIES.map(() => new Animated.Value(0)), []);
  useEffect(() => {
    if (reduced) return;
    const loops = waves.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: FLIES[i]![3],
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: NATIVE,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: FLIES[i]![3],
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: NATIVE,
          }),
        ]),
      ),
    );
    loops.forEach((loop, i) => setTimeout(() => loop.start(), i * 230));
    return () => loops.forEach((loop) => loop.stop());
  }, [reduced, waves]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} aria-hidden>
      {FLIES.map(([x, y, size], i) => {
        const v = waves[i]!;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: size * 3,
              height: size * 3,
              borderRadius: size * 1.5,
              alignItems: 'center',
              justifyContent: 'center',
              // A soft glow round the light itself.
              backgroundColor: withAlpha(c.brandAccent, 0.16),
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.95] }),
              transform: [
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, -6] }) },
                { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] }) },
              ],
            }}
          >
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: c.brandAccent,
              }}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}
