import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';

/** How long the spark flies (ms). */
export const SPARK_MS = 560;

export type Point = { x: number; y: number };
export type Anchor = { ref: RefObject<ComponentRef<typeof View> | null>; offset: Point };

/** A dot of the spark and its trail: how far behind it runs, its size and its strength. */
export const DOTS = [
  { lag: 0, size: 12, opacity: 1 },
  { lag: 0.1, size: 8, opacity: 0.6 },
  { lag: 0.2, size: 5, opacity: 0.35 },
] as const;

export const where = (anchor: Anchor) =>
  new Promise<Point | null>((resolve) => {
    if (!anchor.ref.current) return resolve(null);
    anchor.ref.current.measureInWindow((x, y) =>
      resolve({ x: x + anchor.offset.x, y: y + anchor.offset.y }),
    );
  });
