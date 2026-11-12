import { BOX, BURST_FROM } from '@/components/mascot/personality';

/** The mascot's height in the heading (px). */
export const HEADING_MASCOT = 92;

/** Where the mascot's lantern is inside its box (px from its top left), for the spark to start. */
export const lanternInMascot = () => {
  const k = HEADING_MASCOT / BOX.height;
  return { x: BURST_FROM.lantern.x * k, y: BURST_FROM.lantern.y * k };
};
