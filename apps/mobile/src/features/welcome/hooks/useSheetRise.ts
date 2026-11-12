import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { Animated, Easing, Platform, type View } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const NATIVE = Platform.OS !== 'web';
const RISE_MS = 380;
const FALL_MS = 300;
/** The panel is this much taller than the screen, so its rounded top leaves the screen at the end. */
const RISE_OVERHANG = 40;

/**
 * "Join the pilot" and "I already have an account": the white sheet rises all the way up and fills
 * the screen, then the next page fades in. A panel starts exactly over the sheet and slides up with
 * a transform (run natively); coming back to this page lowers it into place again.
 */
export function useSheetRise(screenHeight: number) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const y = useRef(new Animated.Value(0)).current;
  const sheet = useRef<ComponentRef<typeof View>>(null);
  /** Where the sheet's top was when it rose (window px), so it can come back down there. */
  const sheetTop = useRef(0);
  const raised = useRef(false);

  const rise = (then: () => void) => {
    if (reduced || !sheet.current) return then();
    // Measured at the tap, not from onLayout: the start must sit exactly on the sheet.
    sheet.current.measureInWindow((_x, top) => {
      sheetTop.current = top;
      y.setValue(top);
      setVisible(true);
      raised.current = true;
      Animated.timing(y, {
        toValue: -RISE_OVERHANG,
        duration: RISE_MS,
        easing: Easing.bezier(0.05, 0.7, 0.1, 1),
        useNativeDriver: NATIVE,
      }).start(({ finished }) => finished && then());
    });
  };

  // Back on this page: lower the panel into the sheet again.
  useFocusEffect(
    useCallback(() => {
      if (!raised.current) return;
      raised.current = false;
      Animated.timing(y, {
        toValue: sheetTop.current,
        duration: FALL_MS,
        easing: Easing.bezier(0.3, 0, 0.8, 0.15),
        useNativeDriver: NATIVE,
      }).start(() => setVisible(false));
    }, [y]),
  );

  return { sheet, y, visible, rise, panelHeight: screenHeight + RISE_OVERHANG };
}
