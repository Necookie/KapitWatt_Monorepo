/**
 * Type: Albert Sans only, the Material 3 type scale, plus `data` styles for kW, kWh, PHP and countdowns.
 *
 * React Native cannot pick weights from a variable font, so each weight is its own family, loaded from
 * packages/assets/fonts/static by @kapitwatt/styles. Sizes and line heights are in dp (px on the web).
 */
export const fontFamily = {
  regular: 'AlbertSans-Regular',
  medium: 'AlbertSans-Medium',
  semibold: 'AlbertSans-SemiBold',
  bold: 'AlbertSans-Bold',
} as const;

export const fontWeight = { regular: '400', medium: '500', semibold: '600', bold: '700' } as const;

export type FontWeightName = keyof typeof fontFamily;

export type TypeStyle = {
  weight: FontWeightName;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  /** Digits line up in columns and countdowns do not jitter. */
  tabular?: boolean;
};

const t = (
  weight: FontWeightName,
  fontSize: number,
  lineHeight: number,
  letterSpacing = 0,
  tabular = false,
): TypeStyle => ({
  weight,
  fontSize,
  lineHeight,
  letterSpacing,
  ...(tabular ? { tabular } : {}),
});

/** Material 3 roles. Display and headline are SemiBold (stock M3 uses Regular) for a firmer brand voice. */
export const typeScale = {
  displayLarge: t('semibold', 57, 64, -0.25),
  displayMedium: t('semibold', 45, 52),
  displaySmall: t('semibold', 36, 44),
  headlineLarge: t('semibold', 32, 40),
  headlineMedium: t('semibold', 28, 36),
  headlineSmall: t('semibold', 24, 32),
  titleLarge: t('semibold', 22, 28),
  titleMedium: t('semibold', 16, 24, 0.15),
  titleSmall: t('semibold', 14, 20, 0.1),
  bodyLarge: t('regular', 16, 24, 0.5),
  bodyMedium: t('regular', 14, 20, 0.25),
  bodySmall: t('regular', 12, 16, 0.4),
  labelLarge: t('medium', 14, 20, 0.1),
  labelMedium: t('medium', 12, 16, 0.5),
  labelSmall: t('medium', 11, 16, 0.5),

  /** Numbers that matter: committed kW, verified kWh, credit, countdown. Always tabular. */
  dataLarge: t('semibold', 45, 52, -0.5, true),
  dataMedium: t('semibold', 32, 40, -0.25, true),
  dataSmall: t('semibold', 20, 28, 0, true),
} as const;

export type TypeRole = keyof typeof typeScale;
