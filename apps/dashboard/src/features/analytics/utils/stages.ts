import type { AlertAnalytics } from '@kapitwatt/shared';

export const STAGES: Record<
  AlertAnalytics['funnel'][number]['stage'],
  { label: string; hint: string }
> = {
  committed: { label: 'Committed', hint: 'Households that committed a cut' },
  evidence_started: {
    label: 'Evidence started',
    hint: 'Before photo sent, or meter data arriving',
  },
  evidence_complete: {
    label: 'Evidence complete',
    hint: 'Both photos passed, or enough meter data',
  },
  verified: { label: 'Verified', hint: 'Settled with a verified cut' },
};
