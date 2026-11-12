import { themes } from '@kapitwatt/styles';
import { Animated, View } from 'react-native';
import { withAlpha } from '@kapitwatt/tokens';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { svgHidden } from '@/lib/svgHidden';

const c = themes.light.color;

/** The scene's grid. Other scenes on this street (sign-up's lanterns) place things on it too. */
export const SCENE = { width: 360, height: 150 } as const;
const W = SCENE.width;
const H = SCENE.height;
/** The street (roofs and windows) sits in the bottom 92 of the scene, under the mountain. */
export const STREET_TOP = H - 92;
export const WINDOW = 10;

/** Mt. Banahaw behind the town: a broad volcano with its twin summits, as seen from the pilot towns. */
const MOUNTAIN =
  'M0 150 V112 L36 98 L80 76 L114 58 L134 50 L150 54 L166 46 L184 52 L214 66 L256 84 L300 98 L360 108 V150 Z';

/** A power line across the town: two poles and two wires sagging between them (the grid). */
const POLES = [22, 334];
const WIRES = ['M24 82 Q180 112 336 82', 'M24 89 Q180 120 336 89'];

/** Height of the upper wire at x on the grid (the curve above: x runs evenly from pole to pole). */
export function wireY(x: number) {
  const t = (x - 24) / 312;
  return 82 + 60 * t * (1 - t);
}

/** Rooftops of a Laguna street: gable roofs of different heights, drawn on a 360 x 92 grid. */
const ROOFS =
  'M0 92 V58 L22 40 L44 58 V92 Z M40 92 V48 L68 26 L96 48 V92 Z M92 92 V62 L112 46 L132 62 V92 Z ' +
  'M128 92 V42 L160 18 L192 42 V92 Z M188 92 V56 L210 38 L232 56 V92 Z M228 92 V46 L256 24 L284 46 V92 Z ' +
  'M280 92 V60 L300 44 L320 60 V92 Z M316 92 V50 L338 32 L360 50 V92 Z';

/** Windows: x, y on the grid and the share of the cut at which each switches off, so they go dark in turn. */
export const WINDOWS = [
  [14, 66, 0.05],
  [56, 56, 0.6],
  [74, 70, 0.3],
  [106, 70, 0.75],
  [144, 50, 0.15],
  [166, 64, 0.5],
  [202, 66, 0.85],
  [242, 54, 0.4],
  [262, 70, 0.2],
  [294, 70, 0.65],
  [332, 60, 0.1],
] as const;

/**
 * The foot of the night scene: Mt. Banahaw, a power line strung across the town, and the street.
 * Every window is lit; as `cut` runs from 0 to 1 they switch off one after another (the household
 * cutting with its neighbours). The windows are Views over the drawn roofs, so only their opacity
 * animates. Tones are the deep indigo role at set strengths over Grid Indigo (no raw palette).
 */
export function Skyline({ cut, width }: { cut: Animated.Value; width: number }) {
  const k = width / W;
  return (
    <View style={{ width, height: H * k }} aria-hidden>
      <Svg width={width} height={H * k} viewBox={`0 0 ${W} ${H}`} {...svgHidden}>
        <Path d={MOUNTAIN} fill={withAlpha(c.onPrimaryContainer, 0.42)} />
        {POLES.map((x) => (
          <G key={x}>
            <Rect x={x} y={78} width={3} height={60} fill={c.onPrimaryContainer} />
            <Rect x={x - 7} y={80} width={17} height={2.5} rx={1} fill={c.onPrimaryContainer} />
          </G>
        ))}
        {WIRES.map((d) => (
          <Path key={d} d={d} stroke={c.onPrimaryContainer} strokeWidth={1.2} fill="none" />
        ))}
        <Path d={ROOFS} fill={c.onPrimaryContainer} transform={`translate(0 ${STREET_TOP})`} />
      </Svg>
      {WINDOWS.map(([x, y, at], i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: x * k,
            top: (y + STREET_TOP) * k,
            width: WINDOW * k,
            height: WINDOW * k,
            borderRadius: 1.5 * k,
            backgroundColor: c.tertiaryContainer,
            opacity: cut.interpolate({
              inputRange: [at, at + 0.08],
              outputRange: [1, 0.12],
              extrapolate: 'clamp',
            }),
          }}
        />
      ))}
    </View>
  );
}
