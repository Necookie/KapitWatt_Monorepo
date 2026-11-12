import { SCENE, WINDOWS, wireY } from '@/components/night/Skyline';

/** One lantern per sign-up step. */
export const LANTERNS = 6;
/** Lantern size on the scene's grid, and the string it hangs from. */
export const LANTERN = 22;
export const STRING = 5;
/** The household's own window (one of the street's), marked with a pin once a barangay is picked. */
export const HOME = WINDOWS[2];
/** The street sign hangs off the right-hand pole. */
export const SIGN = { right: 331, top: 115 };
/** Windows light up one after another at review. */
export const WINDOWS_MS = 1400;

/** A lantern's centre on the scene's grid: spaced evenly along the upper wire between the poles. */
export function lanternAt(i: number) {
  const x = 24 + (312 * (i + 1)) / (LANTERNS + 1);
  return { x, top: wireY(x), y: wireY(x) + STRING + 2 + LANTERN / 2 };
}

/** Lantern i's centre in px, from the street's top left corner (for the spark to fly to). */
export function lanternCentre(i: number, width: number) {
  const k = width / SCENE.width;
  const at = lanternAt(i);
  return { x: at.x * k, y: at.y * k };
}
