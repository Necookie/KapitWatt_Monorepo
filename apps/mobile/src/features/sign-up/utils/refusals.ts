import type { StepId } from './draft';

/** Refusals that belong to one step: the household is sent back there to fix it. */
export const REFUSALS: Record<string, { step: StepId; message: string }> = {
  email_taken: {
    step: 'account',
    message: 'That email already has an account. Log in instead, or use another email.',
  },
  account_taken: {
    step: 'meralco',
    message: 'That Meralco account is already enrolled. Check the number, or log in.',
  },
  unknown_barangay: { step: 'home', message: 'That barangay is not in the pilot.' },
};
