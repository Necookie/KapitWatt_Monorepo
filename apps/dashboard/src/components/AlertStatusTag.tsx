import type { AlertStatus } from '@kapitwatt/shared';
import { Tag, type TagTone } from './ui';

const STATUS: Record<AlertStatus, { label: string; tone: TagTone }> = {
  scheduled: { label: 'Scheduled', tone: 'neutral' },
  active: { label: 'Commits open', tone: 'brand' },
  window_open: { label: 'Window open', tone: 'brand' },
  settling: { label: 'Measuring', tone: 'warning' },
  settled: { label: 'Settled', tone: 'good' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

/** Where an alert stands, in the operator's words. */
export function AlertStatusTag({ status }: { status: AlertStatus }) {
  const { label, tone } = STATUS[status];
  return <Tag label={label} tone={tone} />;
}
