import { themes } from '@kapitwatt/styles';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const c = themes.light.color;
const NATIVE = Platform.OS !== 'web';
/** The lantern's size and its string (px). */
const SIZE = 8;
const STRING = 4;

/**
 * The active tab's mark: a small lantern hanging from the top of the bar on a string, like the
 * ones that light up on sign-up. It lights with a little drop when its tab is chosen.
 */
export function TabLantern({ on }: { on: boolean }) {
  const reduced = useReducedMotion();
  const lit = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return lit.setValue(on ? 1 : 0);
    Animated.timing(lit, {
      toValue: on ? 1 : 0,
      duration: on ? 360 : 160,
      easing: on ? Easing.out(Easing.back(2.4)) : Easing.linear,
      useNativeDriver: NATIVE,
    }).start();
  }, [on]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.hang,
        {
          opacity: lit,
          transform: [
            { translateY: lit.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) },
          ],
        },
      ]}
    >
      <View style={styles.string} />
      <View style={styles.lantern}>
        <View style={styles.rib} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hang: { position: 'absolute', top: -1, alignItems: 'center' },
  string: { width: 1, height: STRING, backgroundColor: c.outline },
  lantern: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: c.brandAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rib: { width: 1, height: SIZE - 3, backgroundColor: c.tertiaryContainer },
});
