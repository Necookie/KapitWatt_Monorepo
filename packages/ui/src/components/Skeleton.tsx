import { useTheme } from '@kapitwatt/hooks';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  View,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';

type Radius = 'xs' | 'sm' | 'md' | 'lg' | 'full';

/**
 * Loading placeholder in the shape of the content it stands in for: a block in
 * surfaceContainerHighest with a soft pulse. Still when the OS asks for reduced motion.
 * Hidden from screen readers; give the surrounding region an accessible "Loading" label.
 */
export function Skeleton({
  width = '100%',
  height = 12,
  radius = 'xs',
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: Radius;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const pulse = usePulse();
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: t.radius[radius],
          backgroundColor: t.color.surfaceContainerHighest,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

/** Lines of placeholder text; the last one is shorter, like a paragraph's last line. */
export function SkeletonText({
  lines = 3,
  lineHeight = 10,
  gap = 8,
  lastLineWidth = '60%',
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: DimensionValue;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </View>
  );
}

/** One shared 1.4 s opacity pulse per skeleton; a fixed value under reduced motion. */
function usePulse(): Animated.Value {
  const value = useRef(new Animated.Value(1)).current;
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => alive && setReduced(on))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  useEffect(() => {
    if (reduced) {
      value.setValue(0.7);
      return;
    }
    const useNativeDriver = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 0.45, duration: 700, useNativeDriver }),
        Animated.timing(value, { toValue: 1, duration: 700, useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, value]);
  return value;
}
