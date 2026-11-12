import { duration, easing } from '@kapitwatt/tokens';
import { StyleSheet, type ViewStyle } from 'react-native';

/**
 * Micro motion for the dashboard (web only). Everything here is CSS: the browser runs it, so no
 * animation re-renders React. Keyframe animations play once when their element mounts; transitions
 * play when a style value changes. M3 durations and curves from the tokens; no bounce. The global
 * reduced-motion rule (styles/GlobalStyles) switches all of it off.
 */
export const bezier = (c: readonly number[]) => `cubic-bezier(${c.join(', ')})`;

export const curve = {
  standard: bezier(easing.standard),
  decelerate: bezier(easing.emphasizedDecelerate),
};

/** A CSS transition on `props` (CSS names, comma separated). */
export function transition(
  props: string,
  ms: number = duration.medium4,
  ease: keyof typeof curve = 'standard',
): ViewStyle {
  return {
    transitionProperty: props,
    transitionDuration: `${ms}ms`,
    transitionTimingFunction: curve[ease],
  } as unknown as ViewStyle;
}

/**
 * A horizontal bar's fill as a transform (full width, scaled from the left) with a transition, so a
 * new value glides on the compositor instead of relaying out the bar every frame.
 */
export const barScale = (share: number): ViewStyle =>
  ({
    width: '100%',
    transformOrigin: 'left',
    transform: [{ scaleX: Math.max(0, Math.min(share, 1)) }],
    ...transition('transform'),
  }) as ViewStyle;

/** True when the operating system asks for reduced motion (for the few JavaScript-driven effects). */
export const reducedMotion = () =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * A one-off entrance. Fill `backwards`, not `both`: once it ends the element is back on its own
 * style and the animation is released (a `both` fill keeps every finished entrance alive, so the
 * page carries hundreds of idle animations).
 */
const once = (ms: number, ease: keyof typeof curve = 'decelerate') => ({
  animationDuration: `${ms}ms`,
  animationTimingFunction: curve[ease],
  animationFillMode: 'backwards',
});

const loop = (ms: number) => ({
  animationDuration: `${ms}ms`,
  animationTimingFunction: 'ease-in-out',
  animationIterationCount: 'infinite',
});

// RN's style types do not know CSS animations; react-native-web compiles them (StyleSheet only).
// Inside keyframes, transforms must be CSS strings: react-native-web drops transform arrays there.
// Entrances give only `from`: they run to the element's own style, whatever it is (a bar's own
// scale, a label's own opacity), so one rule serves every element.
const sheet = (styles: Record<string, object>) =>
  StyleSheet.create(styles as Record<string, ViewStyle>);

export const motion = sheet({
  /** Fades in: content replacing its skeleton, a panel swapping its subject. */
  fadeIn: {
    animationKeyframes: [{ from: { opacity: 0 } }],
    ...once(duration.medium2, 'standard'),
  },
  /** Slides down into place: a notification arriving, a step opening. */
  dropIn: {
    animationKeyframes: [{ from: { opacity: 0, transform: 'translateY(-12px)' } }],
    ...once(duration.medium4),
  },
  /** Rises into place: the next card moving up a queue. */
  riseIn: {
    animationKeyframes: [{ from: { opacity: 0, transform: 'translateY(12px)' } }],
    ...once(duration.medium4),
  },
  /** A mark appearing: a check, a target-hit badge, a count that changed. */
  pop: {
    animationKeyframes: [{ from: { opacity: 0, transform: 'scale(0.6)' } }],
    ...once(duration.medium2),
  },
  /**
   * Bars grow from their baseline (left, or bottom) on first show, to their own scale: pair with
   * `barScale` so later values glide on the compositor.
   */
  growX: {
    animationKeyframes: [{ from: { transform: 'scaleX(0)' } }],
    ...once(duration.long2),
    transformOrigin: 'left',
  },
  growY: {
    animationKeyframes: [{ from: { transform: 'scaleY(0)' } }],
    ...once(duration.long2),
    transformOrigin: 'bottom',
  },
  /** Draws a line chart left to right on first show (on the chart's box). */
  wipe: {
    animationKeyframes: [
      { from: { clipPath: 'inset(0 100% 0 0)' }, to: { clipPath: 'inset(0 0% 0 0)' } },
    ],
    ...once(700),
  },
  /** A live indicator's ring: grows and fades, again and again. */
  ping: {
    animationKeyframes: [
      {
        '0%': { opacity: 0.7, transform: 'scale(1)' },
        '80%, 100%': { opacity: 0, transform: 'scale(2.4)' },
      },
    ],
    ...loop(2000),
  },
  /**
   * SVG arcs sweep in from nothing on first show (pair with `arcStyle`). A keyframe with only `from`
   * animates to the arc's own value, so one static animation serves every arc.
   */
  sweep: {
    animationKeyframes: [{ from: { strokeDasharray: '0 100000' } }],
    ...once(duration.long2 * 2),
  },
  /** The calm mascot, breathing. */
  breathe: {
    animationKeyframes: [
      {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.04)' },
      },
    ],
    ...loop(4000),
  },
});

/**
 * Props for an SVG arc drawn with a dash: it sweeps in on first show, and a new value glides there
 * instead of jumping. The dash goes in `style` because CSS animates only style values. Spread it on
 * the Circle or Path (react-native-svg's types do not list `style`, but its web build forwards it).
 */
export const arcProps = (dasharray: string): object => ({
  style: [
    motion.sweep,
    { strokeDasharray: dasharray, ...transition('stroke-dasharray', duration.long2) },
  ],
});

/**
 * The same sweeps for charts drawn as plain DOM SVG (not react-native-svg), which react-native-web
 * styles do not reach: the keyframes are global CSS (styles/GlobalStyles), named here.
 */
export const DOM_KEYFRAMES = `
  @keyframes kw-sweep { from { stroke-dasharray: 0 100000; } }
  @keyframes kw-draw { from { stroke-dasharray: 0 1; } to { stroke-dasharray: 1 0; } }
`;
/** On a dashed DOM arc: it sweeps in to its own dash. */
export const domSweep = {
  animation: `kw-sweep ${duration.long2 * 2}ms ${curve.decelerate} backwards`,
};
/** On an undashed DOM path with `pathLength={1}`: it draws in from its start. */
export const domDraw = {
  animation: `kw-draw ${duration.long2 * 2}ms ${curve.decelerate} backwards`,
};
