import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { useEffect, useState } from 'react';
import { StyleSheet, type Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { C, R, SIZE, STROKE } from '../utils/hold-ring';

const c = themes.light.color;

/**
 * The ring that fills while the mascot is held. It redraws itself from `cut` (only this small SVG
 * re-renders, not the mascot), so it needs no animated SVG props, which react-native-web cannot take.
 */
export function ProgressRing({ cut }: { cut: Animated.Value }) {
  const [share, setShare] = useState(0);
  useEffect(() => {
    const id = cut.addListener(({ value }) => setShare(value));
    return () => cut.removeListener(id);
  }, [cut]);
  return (
    <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
      <Circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        stroke={withAlpha(c.onBrand, 0.16)}
        strokeWidth={STROKE}
        fill="none"
      />
      {share > 0 ? (
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={c.brandAccent}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${C * Math.min(share, 1)} ${C}`}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      ) : null}
    </Svg>
  );
}
