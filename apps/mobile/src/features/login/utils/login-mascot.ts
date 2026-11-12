import type { MascotPose } from '@kapitwatt/ui';

/** Where the login form stands, as Alitaptap sees it. */
export interface LoginMood {
  inside: boolean;
  failed: boolean;
  awake: boolean;
  typingPassword: boolean;
  filled: boolean;
  emailOk: boolean;
  poked: boolean;
}

/** Alitaptap's pose: asleep until woken, wincing at a failure, lit up once logged in. */
export function loginPose({ inside, failed, awake }: LoginMood): MascotPose {
  return inside ? 'reward' : failed ? 'missed' : awake ? 'neutral' : 'dimmed';
}

/**
 * Alitaptap's line under the heading, following the form along, in its own voice. Each fits on one
 * line (270 px at most, inside a 320 px phone's column), so the form under it never moves as
 * the line changes.
 */
export function loginLine(m: LoginMood): string {
  return m.inside
    ? "You're in. Welcome home!"
    : m.failed
      ? "Hmm, that didn't work."
      : m.typingPassword
        ? "I'm not looking."
        : m.filled
          ? 'Ready when you are.'
          : m.emailOk
            ? 'Hi again! Now your password.'
            : m.poked
              ? 'Five more minutes… Email, please.'
              : 'Zzz… Type your email to wake me.';
}
