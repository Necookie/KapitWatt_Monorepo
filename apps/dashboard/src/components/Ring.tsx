import Svg, { Circle } from 'react-native-svg';
import { svgHidden } from '@/utils/svg';
import { arcProps } from '@/styles/motion';

/** Progress against a share of the target, as a ring (a town's, a barangay's). */
export function Ring({
  share,
  color,
  track,
  size,
  stroke,
}: {
  share: number;
  color: string;
  track: string;
  /** Outer size and stroke width, px. */
  size: number;
  stroke: number;
}) {
  const mid = size / 2;
  const r = mid - stroke / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }} {...svgHidden}>
      <Circle cx={mid} cy={mid} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      {share > 0 ? (
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          {...arcProps(`${c * Math.min(share, 1)} ${c}`)}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      ) : null}
    </Svg>
  );
}
