import { useEffect, useRef } from 'react';
import { Animated, Easing, Keyboard, Platform } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * How far the sheet's top sits from `top` while the keyboard is open: it slides up by `by` so the
 * form keeps its room, and back down when the keyboard goes. Animates a layout value (the sheet's
 * top), so it runs on the JS thread; it is one short move per keyboard change.
 */
export function useKeyboardLift(top: number, by: number) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(top)).current;

  useEffect(() => {
    const move = (lifted: boolean, ms = 250) => {
      const to = lifted ? top - by : top;
      if (reduced) return value.setValue(to);
      Animated.timing(value, {
        toValue: to,
        duration: ms,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };
    value.setValue(top);
    // iOS says before the keyboard moves; Android only after.
    const ios = Platform.OS === 'ios';
    const shown = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) =>
      move(true, e.duration || 250),
    );
    const hidden = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', (e) =>
      move(false, e.duration || 200),
    );
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [top, by, reduced]);

  return value;
}
