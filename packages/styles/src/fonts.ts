import { fontFamily } from '@kapitwatt/tokens';

// Metro resolves these to asset ids; the static files come from @kapitwatt/assets.
declare function require(id: string): number;

/** Pass to expo-font's `useFonts` (or use `useBrandFonts` from @kapitwatt/hooks). */
export const fontSources = {
  [fontFamily.regular]: require('@kapitwatt/assets/fonts/static/AlbertSans-Regular.ttf'),
  [fontFamily.medium]: require('@kapitwatt/assets/fonts/static/AlbertSans-Medium.ttf'),
  [fontFamily.semibold]: require('@kapitwatt/assets/fonts/static/AlbertSans-SemiBold.ttf'),
  [fontFamily.bold]: require('@kapitwatt/assets/fonts/static/AlbertSans-Bold.ttf'),
} as const;
