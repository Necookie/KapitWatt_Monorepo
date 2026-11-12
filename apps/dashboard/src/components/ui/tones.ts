import { colors } from '@/styles/theme';

export type TagTone = 'neutral' | 'brand' | 'good' | 'warning' | 'critical';

/** Background and text colours per tone, shared by Tag and Notice. */
export const TONES: Record<TagTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.status.neutralSoft, fg: colors.status.neutral },
  brand: { bg: colors.brandSoft, fg: colors.brandStrong },
  good: { bg: colors.status.goodSoft, fg: colors.status.good },
  warning: { bg: colors.status.warningSoft, fg: colors.status.warning },
  critical: { bg: colors.status.criticalSoft, fg: colors.status.critical },
};
