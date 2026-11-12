import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import Svg, { Ellipse, Line, Path, Rect } from 'react-native-svg';
import { svgHidden } from '@/utils/svg-hidden';

const c = themes.light.color;

/** The drawing's grid: a paper lantern 40 wide and 54 tall (caps, body, tassel). */
const W = 40;
const H = 54;
export const LANTERN_ASPECT = W / H;

/**
 * A paper lantern, like Alitaptap's: indigo caps, a round Kuryente Orange body with curved ribs in
 * the peach of the mascot's lantern stripes, and a short tassel. `lit` draws it glowing; `faint`
 * is lit but pale (waiting); unlit is an outline in `ink` with faint ribs. Flat shapes only
 * (DESIGN.md). Decorative: whatever sits beside it says its state in words.
 */
export function Lantern({
  height,
  state = 'lit',
  ink = c.onSurfaceVariant,
}: {
  height: number;
  state?: 'lit' | 'faint' | 'unlit';
  ink?: string;
}) {
  const lit = state !== 'unlit';
  const body = lit ? c.brandAccent : 'none';
  const rib = lit ? c.tertiaryContainer : withAlpha(ink, 0.3);
  const cap = lit ? c.brand : withAlpha(ink, 0.45);
  return (
    <Svg
      width={height * LANTERN_ASPECT}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      opacity={state === 'faint' ? 0.4 : 1}
      {...svgHidden}
    >
      {/* Body, with its outline only when unlit. */}
      <Ellipse
        cx={20}
        cy={27}
        rx={18}
        ry={17}
        fill={body}
        stroke={lit ? 'none' : withAlpha(ink, 0.45)}
        strokeWidth={lit ? 0 : 2}
      />
      {/* Ribs: the paper's folds, curving with the body. */}
      <Path
        d="M20 10 Q9 27 20 44 M20 10 Q31 27 20 44 M20 10 V44"
        fill="none"
        stroke={rib}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Caps and the tassel. */}
      <Rect x={12} y={6} width={16} height={6} rx={2} fill={cap} />
      <Rect x={12} y={42} width={16} height={5} rx={2} fill={cap} />
      <Rect x={18} y={2} width={4} height={5} rx={1} fill={cap} />
      <Line x1={20} y1={47} x2={20} y2={53} stroke={cap} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
