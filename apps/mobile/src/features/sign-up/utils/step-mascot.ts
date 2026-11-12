import type { MascotPose } from '@kapitwatt/ui';
import type { StepId } from './draft';

/**
 * The onboarding steps on the lantern-path sign-up: Alitaptap talks at the top of the white sheet,
 * each step keeps only the fields and the few hints people need.
 * The sign-up screen decides which step shows and when to move on.
 */

/** What the mascot says on each step. The label is the step's name; the line is the heading. */
export const STEP_MASCOT: Record<
  StepId,
  { line: string; pose: MascotPose; tone: 'primary' | 'reward' }
> = {
  account: { line: 'Hi! First, set up your login.', pose: 'neutral', tone: 'primary' },
  privacy: { line: 'Your data stays safe with us.', pose: 'neutral', tone: 'primary' },
  meralco: { line: 'Grab your bill. It has everything we need.', pose: 'neutral', tone: 'primary' },
  home: { line: "Where's home? Pick your barangay.", pose: 'neutral', tone: 'primary' },
  meter: { line: 'Check your meter. Which kind is it?', pose: 'neutral', tone: 'primary' },
  review: { line: 'Almost there! Check your details.', pose: 'reward', tone: 'reward' },
};
