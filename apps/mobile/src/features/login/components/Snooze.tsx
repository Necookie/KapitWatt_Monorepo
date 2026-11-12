import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { useEffect, useMemo } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { MOON_OUTER } from '@/components/night/Moon';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const c = themes.light.color;
const NATIVE = Platform.OS !== 'web';

/** The z's of a sleeping Alitaptap: each drifts up and away in turn. */
const SNOOZE_MS = 2700;
const ZS = [
  { size: 16, delay: 0 },
  { size: 21, delay: SNOOZE_MS / 3 },
  { size: 26, delay: (SNOOZE_MS * 2) / 3 },
] as const;

export function Snooze() {
  const reduced = useReducedMotion();
  const drift = useMemo(() => ZS.map(() => new Animated.Value(reduced ? 0.5 : 0)), [reduced]);
  useEffect(() => {
    if (reduced) return;
    const loops = drift.map((v, i) =>
      Animated.sequence([
        Animated.delay(ZS[i]!.delay),
        Animated.loop(
          Animated.timing(v, {
            toValue: 1,
            duration: SNOOZE_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: NATIVE,
          }),
        ),
      ]),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [drift, reduced]);

  return (
    <View pointerEvents="none" style={styles.snooze} aria-hidden>
      {ZS.map((z, i) => {
        const v = drift[i]!;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              opacity: v.interpolate({ inputRange: [0, 0.2, 0.75, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) },
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -46] }) },
                { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '10deg'] }) },
              ],
            }}
          >
            <Text style={{ fontSize: z.size, lineHeight: z.size + 4, color: c.primaryContainer }}>
              z
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Off the moon's upper right, by Alitaptap's head.
  snooze: {
    position: 'absolute',
    top: MOON_OUTER * 0.2,
    left: '50%',
    marginLeft: MOON_OUTER * 0.42,
    width: 1,
    height: 1,
  },
});
