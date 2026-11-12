import { color as roles, withAlpha } from '@kapitwatt/tokens';
import { Mascot } from '@kapitwatt/ui';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ON } from '@/styles/on-brand';
import { svgHidden } from '../utils/svg';

/** The mascot resting in rings that echo the alert gauge: the same place, nothing to measure yet. */
export function RestingMascot({ size }: { size: number }) {
  const mid = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }} {...svgHidden}>
        <Circle cx={mid} cy={mid} r={mid - 2} fill={withAlpha(ON, 0.05)} />
        <Circle cx={mid} cy={mid} r={mid * 0.86} fill={withAlpha(ON, 0.07)} />
        {/* A light disc: the mascot is Grid Indigo and would vanish on the hero. */}
        <Circle cx={mid} cy={mid} r={mid * 0.68} fill={roles.light.primaryContainer} />
        <Circle
          cx={mid}
          cy={mid}
          r={mid - 9}
          stroke={withAlpha(ON, 0.22)}
          strokeWidth={2}
          strokeDasharray="2 10"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      {/* Positioned, so it paints above the absolutely placed rings on the web. */}
      <View style={{ zIndex: 1 }}>
        <Mascot pose="neutral" height={size * 0.56} />
      </View>
    </View>
  );
}
