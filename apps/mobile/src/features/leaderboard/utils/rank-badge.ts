import { themes } from '@kapitwatt/styles';

const c = themes.light.color;

/** The rank circle's colours: the household's own barangay, then first, second, the rest. */
export const rankBadge = (rank: number, isMine: boolean) =>
  isMine
    ? { bg: c.primary, fg: c.onPrimary }
    : rank === 1
      ? { bg: c.brandAccent, fg: c.onBrandAccent }
      : rank === 2
        ? { bg: c.tertiaryContainer, fg: c.onTertiaryContainer }
        : { bg: c.surfaceContainerHigh, fg: c.onSurfaceVariant };
