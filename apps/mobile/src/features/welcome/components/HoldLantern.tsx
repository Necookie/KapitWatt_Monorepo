import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { MoonMascot } from '@/components/night/Moon';
import { SIZE } from '../utils/hold-ring';
import { FitPicture } from './FitPicture';
import { ProgressRing } from './ProgressRing';

const c = themes.light.color;

/** How long a full hold takes. */
const HOLD_MS = 1600;

/**
 * The cut, tried by hand: press and hold the mascot, the ring fills, and when it closes the lantern
 * dims (the dimmed pose). Letting go early springs it back. `cut` is shared with the street below,
 * whose windows go dark as it fills. Screen readers get a plain action that completes it at once.
 */
export function HoldLantern({ cut, onDone }: { cut: Animated.Value; onDone: () => void }) {
  const [state, setState] = useState<'idle' | 'holding' | 'done'>('idle');
  const reduced = useReducedMotion();
  // Until it is first held, the ring breathes, so it reads as something to press.
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'idle' || reduced) {
      breath.setValue(0);
      return;
    }
    const native = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: native,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: native,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, reduced, breath]);

  const finish = () => {
    cut.setValue(1);
    setState('done');
    onDone();
  };

  const start = () => {
    if (state === 'done') return;
    setState('holding');
    cut.stopAnimation((value) => {
      Animated.timing(cut, {
        toValue: 1,
        duration: HOLD_MS * (1 - value),
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(({ finished }) => finished && finish());
    });
  };

  const release = () => {
    if (state === 'done') return;
    cut.stopAnimation((value) => {
      if (value >= 1) return;
      setState('idle');
      Animated.timing(cut, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    });
  };

  const hint =
    state === 'done'
      ? 'Cut! Your lantern is dimmed.'
      : state === 'holding'
        ? 'Keep holding…'
        : 'Press and hold';

  return (
    <View style={styles.wrap}>
      {/* The ring shrinks to fit a short screen; the hint under it keeps its size. */}
      <FitPicture>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try a cut: press and hold the mascot"
          accessibilityState={{ checked: state === 'done' }}
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityAction={() => state !== 'done' && finish()}
          onPressIn={start}
          onPressOut={release}
          style={styles.ring}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [
                  { scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
                ],
              },
            ]}
          >
            <ProgressRing cut={cut} />
          </Animated.View>
          <MoonMascot
            pose={state === 'done' ? 'dimmed' : 'neutral'}
            halo={false}
            pokeable={false}
            excited={state === 'holding'}
          />
        </Pressable>
      </FitPicture>
      <Text variant="labelLarge" style={styles.hint} accessibilityLiveRegion="polite">
        {hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 12 },
  ring: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  hint: { color: withAlpha(c.onBrand, 0.78) },
});
