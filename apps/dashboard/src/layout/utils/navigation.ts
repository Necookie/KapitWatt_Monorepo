import { type IconName } from '@kapitwatt/icons';

export type Destination = {
  href: string;
  label: string;
  /** Rail and bottom bar label. */
  short: string;
  icon: IconName;
  /** P1 screens: shown, marked as later. */
  later?: boolean;
  match?: (pathname: string) => boolean;
};

export const SECTIONS: { title: string; items: Destination[] }[] = [
  {
    title: 'Operate',
    items: [
      {
        href: '/',
        label: 'Live load',
        short: 'Live',
        icon: 'chartLine',
        match: (p) => p === '/' || p.startsWith('/towns'),
      },
      { href: '/alerts/new', label: 'Send alert', short: 'Alert', icon: 'alert' },
    ],
  },
  {
    title: 'Review',
    items: [
      { href: '/analytics', label: 'Analytics', short: 'Analytics', icon: 'chartBar' },
      {
        href: '/flagged',
        label: 'Flagged readings',
        short: 'Flagged',
        icon: 'flagged',
        later: true,
      },
      { href: '/alerts/log', label: 'Alert log', short: 'Log', icon: 'history', later: true },
    ],
  },
  {
    title: 'Demo',
    items: [{ href: '/simulator', label: 'Simulator', short: 'Simulator', icon: 'simulated' }],
  },
];
export const DESTINATIONS = SECTIONS.flatMap((s) => s.items);
