import {
  PHOTO_RULES,
  type FlaggedReading,
  type ReadingFlag,
  type ReadingKind,
} from '@kapitwatt/shared';

/** Why a reading was held, in plain words. OCR only ever flags; it never rejects. */
export const FLAG_LABEL: Record<ReadingFlag, string> = {
  late: 'Late photo',
  serial_mismatch: 'Serial does not match',
  too_far: 'Too far from address',
  not_increasing: 'Not higher than last reading',
  implausible_draw: 'More than the service could draw',
  duplicate_photo: 'Reused photo',
  ocr_mismatch: 'OCR differs from typed reading',
};

export const KIND_LABEL: Record<ReadingKind, string> = {
  rehearsal: 'Rehearsal',
  before: 'Before',
  after: 'After',
};

/** What a reviewer should look for, per check: the part no rule can do. */
export function flagHelp(flag: ReadingFlag, r: FlaggedReading): string {
  switch (flag) {
    case 'late':
      return `The photo came in after its deadline (before photos within ${PHOTO_RULES.beforeDeadlineMin} min of the window start, after photos within ${PHOTO_RULES.afterDeadlineMin} min of its end). Approve only if the delay was not the household's doing.`;
    case 'serial_mismatch':
      return `Look for ${r.meterSerial} on the meter face. Approve if it is there and just hard to read.`;
    case 'too_far':
      return 'The phone was further from the registered address than allowed. Approve if the photo clearly shows the registered meter.';
    case 'not_increasing':
      return 'The typed reading is not higher than the previous one. Read the register in the photo: a typo is the usual cause.';
    case 'implausible_draw':
      return 'The change is more than the service could draw in that time. Read the register digits in the photo.';
    case 'duplicate_photo':
      return 'This exact photo was uploaded before. Reject unless it is clearly a new photo.';
    case 'ocr_mismatch':
      return 'Text recognition read a different number. It only flags, never rejects: compare the register with the typed reading.';
  }
}
