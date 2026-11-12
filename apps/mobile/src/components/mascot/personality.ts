import type { MascotPose } from '@kapitwatt/ui';

/**
 * How Alitaptap moves in each pose. Coordinates are in the pose box (304 x 498 px, the cut in
 * packages/assets/source/mascot.py), measured from the reference artwork.
 */
export const BOX = { width: 304, height: 498 } as const;

/** What burst marks radiate from: the head above the cheeks, the lantern below. */
export const BURST_FROM = { head: { x: 152, y: 170 }, lantern: { x: 152, y: 400 } } as const;

/** Where each wing joins the body: it flaps about this point. */
export const WING_ROOT = { left: { x: 100, y: 317 }, right: { x: 204, y: 317 } } as const;

/** A region of the pose box: a polygon, a circle or an ellipse. */
export type Shape =
  | { points: readonly (readonly [number, number])[] }
  | { x: number; y: number; r: number }
  | { x: number; y: number; rx: number; ry: number };

/** The head's silhouette, near enough an ellipse: what shows behind a hand raised across it. */
const HEAD: Shape = { x: 152, y: 212, rx: 105, ry: 95 };

/**
 * The left hand of a pose (the right one mirrors it): the region it is cut from, the indigo body
 * behind it (head, torso; drawn only inside the region, so no hole shows when the hand moves and
 * nothing shows outside the body), and the point it turns about.
 */
type Arm = { shape: Shape; patch: readonly Shape[]; pivot: { x: number; y: number } };

/** Stubby arms hanging at the torso's sides, marked off by a white line (neutral, missed, dimmed). */
const HANGING: Arm = {
  shape: {
    points: [
      [58, 300],
      [98, 293],
      [112, 299],
      [120, 322],
      [116, 349],
      [70, 349],
      [58, 326],
    ],
  },
  patch: [
    {
      points: [
        [100, 297],
        [118, 300],
        [124, 322],
        [120, 349],
        [102, 349],
      ],
    },
  ],
  pivot: { x: 104, y: 296 },
};

export const ARMS: Record<MascotPose, { left: Arm } | null> = {
  neutral: { left: HANGING },
  missed: { left: HANGING },
  dimmed: { left: HANGING },
  // Round fists held on the torso.
  alert: {
    left: {
      shape: { x: 104, y: 316, r: 26 },
      patch: [{ x: 104, y: 316, r: 25 }],
      pivot: { x: 104, y: 316 },
    },
  },
  // Mitts raised beside the head, outlined in white where they cross it. The region hugs that
  // outline (measured from the artwork) and stops short of the cheek.
  reward: {
    left: {
      shape: {
        points: [
          [28, 256],
          [28, 246],
          [40, 242],
          [58, 240],
          [66, 246],
          [74, 253],
          [83, 264],
          [93, 276],
          [100, 284],
          [112, 298],
          [120, 316],
          [100, 320],
          [84, 314],
          [70, 308],
          [58, 300],
          [46, 292],
          [36, 282],
          [29, 268],
        ],
      },
      patch: [
        HEAD,
        // The head's edge just behind the arm's outline, so no gap opens between them as the hand
        // moves out (the head ellipse falls a little short of it there).
        {
          points: [
            [58, 240],
            [66, 246],
            [74, 253],
            [83, 264],
            [93, 276],
            [100, 284],
            [112, 298],
            [102, 308],
            [90, 294],
            [83, 286],
            [73, 274],
            [64, 263],
            [56, 256],
            [48, 250],
          ],
        },
        // The torso's top corner under the shoulder (only the torso: a wider patch would show
        // beside it once the arm lifts away).
        {
          points: [
            [108, 294],
            [124, 294],
            [124, 318],
            [112, 318],
          ],
        },
      ],
      pivot: { x: 104, y: 304 },
    },
  },
};

type Eye = { x: number; y: number; width: number; height: number };

export type Personality = {
  /** Open eyes it can blink (none when they are closed in the artwork). */
  eyes: readonly [Eye, Eye] | null;
  /** Floats up and down: px, ms per float. */
  bob: number;
  bobMs: number;
  /** Breathes: how much it stretches, ms per breath. */
  breath: number;
  breathMs: number;
  /** Leans side to side: degrees, ms per lean. */
  sway: number;
  swayMs: number;
  /** Wings: steady buzz, or bursts of flutter now and then. Degrees, ms per beat. */
  wings: 'buzz' | 'flutter' | 'still';
  flap: number;
  flapMs: number;
  /**
   * Hands: `swing` both out and in together (hanging arms), `pump` fists up and down in turn,
   * `wave` raised hands out from the head in turn (a cheer; only outward, so a hand never slides
   * over the face). Degrees (or px for pump), ms.
   */
  hands: 'swing' | 'pump' | 'wave';
  hand: number;
  handMs: number;
  /**
   * The effects drawn around it: `radiate` burst marks pulsing out from the head and the lantern,
   * `twinkle` sparkles flaring in turn, or none. Ms per pulse or twinkle.
   */
  sparks: 'radiate' | 'twinkle' | null;
  sparkMs: number;
  /** Ms between blinks (a range; sometimes it blinks twice). */
  blink: readonly [number, number];
  /** Ms between little hops, or none; how high (px). */
  hopEvery: readonly [number, number] | null;
  hop: number;
};

const eye = (x0: number, y0: number, x1: number, y1: number): Eye => ({
  x: x0 - 2,
  y: y0 - 2,
  width: x1 - x0 + 4,
  height: y1 - y0 + 4,
});

export const PERSONALITY: Record<MascotPose, Personality> = {
  // Curious and calm: floats, breathes, blinks, flutters now and then, hops once in a while.
  neutral: {
    eyes: [eye(77, 169, 134, 235), eye(174, 169, 232, 235)],
    bob: 5,
    bobMs: 1800,
    breath: 0.025,
    breathMs: 2600,
    sway: 2.5,
    swayMs: 3400,
    wings: 'flutter',
    flap: 16,
    flapMs: 90,
    hands: 'swing',
    hand: 4,
    handMs: 1800,
    sparks: null,
    sparkMs: 0,
    blink: [2400, 5200],
    hopEvery: [6000, 9500],
    hop: 14,
  },
  // On duty: wings buzzing, a steady float, fists pumping, burst marks pulsing out.
  alert: {
    eyes: [eye(78, 174, 135, 238), eye(176, 174, 233, 237)],
    bob: 2.5,
    bobMs: 950,
    breath: 0.02,
    breathMs: 1200,
    sway: 1.5,
    swayMs: 1400,
    wings: 'buzz',
    flap: 10,
    flapMs: 55,
    hands: 'pump',
    hand: 4,
    handMs: 350,
    sparks: 'radiate',
    sparkMs: 620,
    blink: [3000, 6000],
    hopEvery: null,
    hop: 0,
  },
  // Happy, in an easy rhythm: hands cheering in turn, wings fluttering, sparkles twinkling, a small
  // hop now and then.
  reward: {
    eyes: null,
    bob: 2.5,
    bobMs: 1000,
    breath: 0.02,
    breathMs: 2000,
    sway: 2,
    swayMs: 2000,
    wings: 'flutter',
    flap: 14,
    flapMs: 90,
    hands: 'wave',
    hand: 3.5,
    handMs: 450,
    sparks: 'twinkle',
    sparkMs: 900,
    blink: [0, 0],
    hopEvery: [3600, 5200],
    hop: 7,
  },
  // A bit down: slow, low, arms barely moving.
  missed: {
    eyes: [eye(73, 182, 131, 243), eye(172, 183, 230, 243)],
    bob: 3,
    bobMs: 3000,
    breath: 0.015,
    breathMs: 3600,
    sway: 3,
    swayMs: 4600,
    wings: 'still',
    flap: 0,
    flapMs: 0,
    hands: 'swing',
    hand: 3,
    handMs: 3000,
    sparks: null,
    sparkMs: 0,
    blink: [3500, 7000],
    hopEvery: null,
    hop: 0,
  },
  // Lantern down for the peak: asleep, arms rising and falling with slow deep breaths.
  dimmed: {
    eyes: null,
    bob: 2,
    bobMs: 3600,
    breath: 0.035,
    breathMs: 3800,
    sway: 1,
    swayMs: 5200,
    wings: 'still',
    flap: 0,
    flapMs: 0,
    hands: 'swing',
    hand: 2.5,
    handMs: 3800,
    sparks: null,
    sparkMs: 0,
    blink: [0, 0],
    hopEvery: null,
    hop: 0,
  },
};
