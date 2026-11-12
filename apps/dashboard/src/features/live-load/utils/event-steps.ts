import type { IconName } from '@kapitwatt/icons';

/** The five core steps of an event, as the readiness page explains them. */
export const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'alert',
    title: 'Alert',
    body: 'NGCP raises a yellow or red alert. You send it to opted-in households.',
  },
  {
    icon: 'commit',
    title: 'Commit',
    body: 'Households commit to a cut in kW for the peak window.',
  },
  { icon: 'energy', title: 'Shift', body: 'They run less during the window and shift the rest.' },
  {
    icon: 'meterPhoto',
    title: 'Measure',
    body: 'Smart-meter data, or meter photos before and after, verify the cut.',
  },
  {
    icon: 'reward',
    title: 'Reward',
    body: 'Credit for verified kWh, with a bonus when the barangay hits its target.',
  },
];
