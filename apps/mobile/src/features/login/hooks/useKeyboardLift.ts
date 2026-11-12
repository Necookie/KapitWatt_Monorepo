import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Platform } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Where the sheet's top sits while the keyboard is open, and how tall the keyboard is. The top
 * slides up by `by` so the form keeps its room, and back down when the keyboard goes. The keyboard
 * height is the sheet's bottom padding: set once per keyboard change (not on every frame of the
 * slide), so the form never re-lays out while it moves. Animates a layout value (the sheet's top),
 * so it runs on the JS thread; it is one short move per keyboard change.
 */
export function useKeyboardLift(top: number, by: number) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(top)).current;
  const [keyboard, setKeyboard] = useState(0);

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
    // iOS says before the keyboard moves; Android only after (and again if its height changes,
    // as when a password field drops the suggestion strip).
    const ios = Platform.OS === 'ios';
    const shown = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      setKeyboard(e.endCoordinates.height);
      move(true, e.duration || 250);
    });
    const hidden = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', (e) => {
      setKeyboard(0);
      move(false, e.duration || 200);
    });
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [top, by, reduced]);

  return { top: value, keyboard };
}
