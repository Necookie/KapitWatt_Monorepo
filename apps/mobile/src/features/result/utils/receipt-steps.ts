import type { MockAlertView, MockResultCard, MyEventStatus } from '@kapitwatt/shared';
import { formatClock, formatKw, formatWindow } from '@/utils/format';

/** One line of a night's receipt: done and fine, flagged for a person to check, or missed/failed. */
export interface ReceiptStep {
  key: string;
  title: string;
  detail?: string;
  state: 'ok' | 'flagged' | 'failed';
}

const CHECK = { pass: 'Passed the checks', flagged: 'Flagged for review', rejected: 'Rejected' };
const STATE = { pass: 'ok', flagged: 'flagged', rejected: 'failed' } as const;

/**
 * The night as a list of ticked steps: the commitment, the before photo (or the smart meter's
 * reading), the cut, the after photo, and the result, with the server's times and each photo's
 * check. Pure, so the receipt only renders what this returns.
 */
export function receiptSteps(
  view: MockAlertView,
  status: MyEventStatus,
  result: MockResultCard,
): ReceiptStep[] {
  const { alert } = view;
  const steps: ReceiptStep[] = [
    { key: 'commit', title: `Committed ${formatKw(result.committedKw)}`, state: 'ok' },
  ];
  const photo = (kind: 'before' | 'after', title: string) => {
    const reading = status.readings.find((r) => r.kind === kind);
    steps.push(
      reading
        ? {
            key: kind,
            title,
            detail: `${formatClock(reading.receivedAt)} · ${CHECK[reading.checkStatus]}`,
            state: STATE[reading.checkStatus],
          }
        : { key: kind, title, detail: 'Missing', state: 'failed' },
    );
  };
  const smartMeter = status.commitment?.path === 'ami';
  if (smartMeter) {
    steps.push({
      key: 'meter',
      title: 'Measured by your smart meter',
      detail: formatWindow(alert.windowStart, alert.windowEnd),
      state: result.zeroReason === 'missing_ami_data' ? 'failed' : 'ok',
    });
  } else {
    photo('before', 'Before photo');
    steps.push({
      key: 'cut',
      title: 'Cut during the peak',
      detail: formatWindow(alert.windowStart, alert.windowEnd),
      state: 'ok',
    });
    photo('after', 'After photo');
  }
  steps.push({
    key: 'result',
    title: result.zeroReason === null ? 'Verified' : 'Not verified',
    detail: formatClock(view.settlesAt),
    state: result.zeroReason === null ? 'ok' : 'failed',
  });
  return steps;
}
