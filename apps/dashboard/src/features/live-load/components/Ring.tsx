import Svg, { Circle } from 'react-native-svg';
import { SIZE, STROKE } from '../utils/town-ring';
import { svgHidden } from '../utils/svg';
import { arcProps } from '@/styles/motion';

/** A town's progress against its share of the target, as a ring. */
export function Ring({ share, color, track }: { share: number; color: string; track: string }) {
  const mid = SIZE / 2;
  const r = mid - STROKE / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }} {...svgHidden}>
      <Circle cx={mid} cy={mid} r={r} stroke={track} strokeWidth={STROKE} fill="none" />
      {share > 0 ? (
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          {...arcProps(`${c * Math.min(share, 1)} ${c}`)}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      ) : null}
    </Svg>
  );
}
