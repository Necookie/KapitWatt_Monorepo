import { mascotXml, type MascotPose } from '@kapitwatt/ui';
import { ARMS, type Shape } from '@/components/mascot/personality';

/**
 * The traced Alitaptap poses split into layers that move on their own:
 * - the wings: the only large lavender shapes (small lavender bits are eye rims and stay put);
 * - the hands: the shapes drawn in INK inside each hand's region (ARMS), clipped out of the
 *   body and drawn in their own layer, with an indigo patch left under each so no hole shows when
 *   a hand moves;
 * - the sparks: orange burst marks and sparkles around the figure (not its cheeks or lantern), one
 *   layer each so each can pulse or twinkle;
 * - the body: everything else.
 * Every layer keeps the pose's viewBox, so stacked they draw the pose exactly.
 */
export type MascotLayers = {
  /** Burst marks and sparkles around the figure, one layer each, with their centre (pose box px). */
  sparks: readonly { xml: string; x: number; y: number }[];
  body: string;
  leftWing: string;
  rightWing: string;
  leftHand: string;
  rightHand: string;
};

const WING = '#E0E0FF';
const ORANGE = '#F95D28';
const INDIGO = '#171C8F';
/**
 * What hands are drawn in: indigo, white outlines, and the thin lavender slivers the tracer left
 * along white lines (anti-aliasing). Inside a hand's region they move with the hand; elsewhere (eye
 * rims) they stay in the body.
 */
const INK = [INDIGO, '#FFFFFF', WING];
/** Wider than this (viewBox units) is a wing, not an eye rim. */
const WING_MIN_WIDTH = 150;
/** The traced viewBox is the pose box (px) times this. */
const SCALE = 3;

const cache = new Map<MascotPose, MascotLayers>();

export function mascotLayers(pose: MascotPose): MascotLayers {
  const hit = cache.get(pose);
  if (hit) return hit;
  const xml = mascotXml[pose];
  const head = xml.slice(0, xml.indexOf('<path'));
  const width = Number(/viewBox="0 0 ([\d.]+)/.exec(head)?.[1] ?? 0);
  const height = Number(/viewBox="0 0 [\d.]+ ([\d.]+)/.exec(head)?.[1] ?? 0);
  const paths = xml.match(/<path[^>]*\/>/g) ?? [];
  const arms = ARMS[pose];

  let handInk = ''; // indigo and white: what the hands are made of
  let rest = '';
  let leftWing = '';
  let rightWing = '';
  const sparks: { xml: string; x: number; y: number }[] = [];
  for (const path of paths) {
    const box = bounds(path);
    const x = (box.left + box.right) / 2 / SCALE;
    const y = (box.top + box.bottom) / 2 / SCALE;
    if (path.includes(`fill="${ORANGE}"`) && !onFigure(x, y)) {
      sparks.push({ xml: `${head}${path}</svg>`, x, y });
    } else if (path.includes(`fill="${WING}"`) && box.right - box.left > WING_MIN_WIDTH) {
      if (box.left < width / 2) leftWing += path;
      else rightWing += path;
    } else if (INK.some((fill) => path.includes(`fill="${fill}"`))) {
      handInk += path;
    } else {
      rest += path;
    }
  }

  const wrap = (inner: string) => `${head}${inner}</svg>`;
  const id = (name: string) => `alitaptap-${pose}-${name}`;
  let body: string;
  let leftHand = '';
  let rightHand = '';
  if (arms) {
    const left = shapePath(arms.left.shape);
    const right = shapePath(mirror(arms.left.shape));
    // One path per shape: in a single path, overlapping shapes of opposite winding cancel out.
    const under = (shapes: readonly Shape[]) =>
      shapes.map((shape) => `<path d="${shapePath(shape)}" fill="${INDIGO}"/>`).join('');
    const outside = `M0 0H${width}V${height}H0Z ${left} ${right}`;
    body = wrap(
      `<defs>` +
        `<clipPath id="${id('body')}"><path d="${outside}" clip-rule="evenodd"/></clipPath>` +
        `<clipPath id="${id('under-left')}"><path d="${left}"/></clipPath>` +
        `<clipPath id="${id('under-right')}"><path d="${right}"/></clipPath>` +
        `</defs>` +
        // What each hand covers (head, torso), kept only inside the hand's region.
        `<g clip-path="url(#${id('under-left')})">${under(arms.left.patch)}</g>` +
        `<g clip-path="url(#${id('under-right')})">${under(arms.left.patch.map(mirror))}</g>` +
        rest +
        `<g clip-path="url(#${id('body')})">${handInk}</g>`,
    );
    leftHand = wrap(
      `<defs><clipPath id="${id('left')}"><path d="${left}"/></clipPath></defs>` +
        `<g clip-path="url(#${id('left')})">${handInk}</g>`,
    );
    rightHand = wrap(
      `<defs><clipPath id="${id('right')}"><path d="${right}"/></clipPath></defs>` +
        `<g clip-path="url(#${id('right')})">${handInk}</g>`,
    );
  } else {
    body = wrap(rest + handInk);
  }
  const layers = {
    sparks,
    body,
    leftWing: wrap(leftWing),
    rightWing: wrap(rightWing),
    leftHand,
    rightHand,
  };
  cache.set(pose, layers);
  return layers;
}

/** A hand region (pose box px) as path data in the traced viewBox. */
function shapePath(shape: Shape): string {
  if ('x' in shape) {
    const [rx, ry] = 'r' in shape ? [shape.r, shape.r] : [shape.rx, shape.ry];
    const [x, y, a, b] = [shape.x * SCALE, shape.y * SCALE, rx * SCALE, ry * SCALE];
    return `M${x - a} ${y} A${a} ${b} 0 1 0 ${x + a} ${y} A${a} ${b} 0 1 0 ${x - a} ${y} Z`;
  }
  return `M${shape.points.map(([x, y]) => `${x * SCALE} ${y * SCALE}`).join(' L')} Z`;
}

/** The right hand is the left one mirrored across the middle of the pose box (304 px). */
function mirror(shape: Shape): Shape {
  if ('x' in shape) return { ...shape, x: 304 - shape.x };
  return { points: shape.points.map(([x, y]) => [304 - x, y] as const) };
}

/**
 * Orange on the figure itself (cheeks at mid-height, the lantern in the middle) rather than around
 * it, by where its centre falls in the pose box (px). Measured from the poses: the effects sit above
 * the head, out at the sides or below the lantern.
 */
function onFigure(x: number, y: number) {
  const cheeks = y > 200 && y < 275;
  const core = x >= 72 && x <= 232 && y >= 160 && y <= 444;
  return cheeks || core;
}

/** The edges of a traced path: its points plus its translate. */
function bounds(path: string) {
  const [tx = 0, ty = 0] = (/translate\(([-\d.]+),([-\d.]+)/.exec(path)?.slice(1) ?? []).map(
    Number,
  );
  const d = /d="([^"]+)"/.exec(path)?.[1] ?? '';
  const numbers = (d.match(/-?\d+\.?\d*/g) ?? []).map(Number);
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    const x = numbers[i]! + tx;
    const y = numbers[i + 1]! + ty;
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  return { left, right, top, bottom };
}
