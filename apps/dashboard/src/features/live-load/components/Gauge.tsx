import { useTheme } from '@kapitwatt/hooks';
import { color as roles, withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { percent } from '@/utils/format';
import { ON, ON_SOFT } from '@/styles/on-brand';
import { svgHidden } from '../utils/svg';

/**
 * Progress against target as a ring: a full circle is the target, marked by the orange tick at the top.
 * The thin inner ring is the forecast (an assumption), shown until the readings are measured.
 */
export function Gauge({
  value,
  forecast,
  target,
  measured,
  size = 176,
}: {
  value: number;
  forecast: number;
  target: number;
  measured: boolean;
  size?: number;
}) {
  const t = useTheme();
  const stroke = 14;
  const mid = size / 2;
  const r = mid - stroke / 2 - 2;
  const ri = r - stroke - 2;
  const arc = (radius: number, share: number) => {
    const c = 2 * Math.PI * radius;
    return `${c * Math.max(0, Math.min(share, 1))} ${c}`;
  };
  const share = target > 0 ? value / target : 0;
  const fshare = target > 0 ? forecast / target : 0;
  const rotate = `rotate(-90 ${mid} ${mid})`;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${percent(value, target)} of target`}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }} {...svgHidden}>
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          stroke={withAlpha(ON, 0.14)}
          strokeWidth={stroke}
          fill="none"
        />
        {share > 0 ? (
          <Circle
            cx={mid}
            cy={mid}
            r={r}
            stroke={measured ? roles.dark.relief : t.color.inversePrimary}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={arc(r, share)}
            transform={rotate}
          />
        ) : null}
        {!measured ? (
          <>
            <Circle
              cx={mid}
              cy={mid}
              r={ri}
              stroke={withAlpha(ON, 0.12)}
              strokeWidth={5}
              fill="none"
            />
            <Circle
              cx={mid}
              cy={mid}
              r={ri}
              stroke={withAlpha(ON, 0.75)}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={arc(ri, fshare)}
              transform={rotate}
            />
          </>
        ) : null}
        <Line
          x1={mid}
          y1={0}
          x2={mid}
          y2={stroke + 6}
          stroke={roles.light.brandAccent}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </Svg>
      <Text variant="dataMedium" style={{ color: ON }}>
        {percent(value, target)}
      </Text>
      <Text variant="labelMedium" style={{ color: ON_SOFT }}>
        of target
      </Text>
    </View>
  );
}
