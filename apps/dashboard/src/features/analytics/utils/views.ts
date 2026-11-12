export type Tab = 'overview' | 'verification' | 'barangays' | 'trends';

export const VIEWS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'verification', label: 'Verification' },
  { value: 'barangays', label: 'Barangays' },
  { value: 'trends', label: 'Trends' },
];
