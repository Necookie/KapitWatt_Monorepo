import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { forwardRef, useEffect, useRef, type ComponentRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { streetHeight } from '@/components/night/geometry';
import { SCENE, Skyline } from '@/components/night/Skyline';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { lanternAt, LANTERNS, WINDOWS_MS } from '../utils/lantern-street';
import { Home } from './Home';
import { Lantern } from './Lantern';
import { Sign } from './Sign';

const c = themes.light.color;
const NATIVE = Platform.OS !== 'web';
const ON_SOFT = withAlpha(c.onBrand, 0.78);

/**
 * Sign-up's header: the welcome screen's night street, now with six lanterns on its power line,
 * one per step. The first `lit` are lit (sign-up raises it as Alitaptap's spark lands in each); the
 * step you are on waits with a ring. Picking a barangay hangs its name on the
 * street sign and marks your window with a pin; at review (`celebrate`) every window lights up.
 * Flat shapes only (DESIGN.md); under reduced motion everything simply appears.
 */
export const LanternStreet = forwardRef<
  ComponentRef<typeof View>,
  {
    step: number;
    lit: number;
    home: string | null;
    celebrate: boolean;
    onBack: () => void;
    backLabel: string;
    disabled?: boolean;
  }
>(function LanternStreet(props, streetRef) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const k = width / SCENE.width;
  const windows = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!props.celebrate) return windows.setValue(1);
    if (reduced) return windows.setValue(0);
    Animated.timing(windows, {
      toValue: 0,
      duration: WINDOWS_MS,
      delay: 200,
      easing: Easing.linear,
      useNativeDriver: NATIVE,
    }).start();
  }, [props.celebrate]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.night} />
      <View ref={streetRef} style={{ width, height: streetHeight(width) }}>
        <Skyline cut={windows} width={width} />
        <Home on={props.home !== null} k={k} />
        {Array.from({ length: LANTERNS }, (_, i) => (
          <Lantern
            key={i}
            k={k}
            at={lanternAt(i)}
            lit={i < props.lit}
            waiting={i === props.step && i >= props.lit}
          />
        ))}
        {props.home ? <Sign name={props.home} k={k} /> : null}
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={props.backLabel}
            disabled={props.disabled}
            onPress={props.onBack}
            style={styles.back}
          >
            <Icon name="back" color="onBrand" />
          </Pressable>
          <Text
            variant="labelLarge"
            style={{ color: ON_SOFT }}
            accessibilityRole="progressbar"
            accessibilityLabel={`Step ${props.step + 1} of ${LANTERNS}`}
            accessibilityValue={{ min: 1, max: LANTERNS, now: props.step + 1 }}
          >
            {props.step + 1} of {LANTERNS}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { backgroundColor: c.brand, overflow: 'hidden' },
  night: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: withAlpha(c.onPrimaryContainer, 0.5),
  },
  topRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
    paddingRight: 20,
  },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
