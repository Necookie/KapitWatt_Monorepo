import { themes } from '@kapitwatt/styles';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { useSpark } from '../hooks/useSpark';
import { DOTS } from '../utils/spark';

const c = themes.light.color;

/** The spark in flight, over the whole screen. Across evenly, up fast then easing in: an arc. */
export function Spark({ t, path }: ReturnType<typeof useSpark>) {
  if (!path) return null;
  const { from, to } = path;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DOTS.map((dot, i) => {
        const range = { inputRange: [dot.lag, 1 + dot.lag], extrapolate: 'clamp' as const };
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: -dot.size / 2,
              top: -dot.size / 2,
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              backgroundColor: c.brandAccent,
              opacity: t.interpolate({
                inputRange: [0, 0.85, 1],
                outputRange: [dot.opacity, dot.opacity, 0],
              }),
              transform: [
                { translateX: t.interpolate({ ...range, outputRange: [from.x, to.x] }) },
                {
                  translateY: t.interpolate({
                    ...range,
                    outputRange: [from.y, to.y],
                    easing: Easing.out(Easing.cubic),
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
