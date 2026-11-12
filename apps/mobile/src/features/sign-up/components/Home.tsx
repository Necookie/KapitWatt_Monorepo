import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { STREET_TOP, WINDOW } from '@/components/night/Skyline';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { HOME } from '../utils/lantern-street';

const c = themes.light.color;
const NATIVE = Platform.OS !== 'web';

/** Your house: its window turns Kuryente Orange under a pin. */
export function Home({ on, k }: { on: boolean; k: number }) {
  const reduced = useReducedMotion();
  const shown = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return shown.setValue(on ? 1 : 0);
    Animated.timing(shown, {
      toValue: on ? 1 : 0,
      duration: on ? 360 : 200,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: NATIVE,
    }).start();
  }, [on]);
  const [x, y] = HOME;
  const pin = 16 * k;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: shown }]}>
      <View
        style={{
          position: 'absolute',
          left: x * k,
          top: (y + STREET_TOP) * k,
          width: WINDOW * k,
          height: WINDOW * k,
          borderRadius: 1.5 * k,
          backgroundColor: c.brandAccent,
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          left: (x + WINDOW / 2) * k - pin / 2,
          top: (y + STREET_TOP) * k - pin - 1,
          transform: [
            { translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [-8 * k, 0] }) },
          ],
        }}
      >
        <Icon name="location" size="sm" weight="fill" color="tertiaryContainer" />
      </Animated.View>
    </Animated.View>
  );
}
