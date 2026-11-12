import { describe, expect, it } from 'vitest';
import { color, type ColorRoles } from './color';
import { contrastRatio, withAlpha } from './contrast';

type Role = keyof ColorRoles;

/** Text and icons on a fill: WCAG AA for body text. */
const textPairs: [Role, Role][] = [
  ['onBrand', 'brand'],
  ['onBrandAccent', 'brandAccent'],
  ['onPrimary', 'primary'],
  ['onPrimaryContainer', 'primaryContainer'],
  ['onSecondary', 'secondary'],
  ['onSecondaryContainer', 'secondaryContainer'],
  ['onTertiary', 'tertiary'],
  ['onTertiaryContainer', 'tertiaryContainer'],
  ['onError', 'error'],
  ['onErrorContainer', 'errorContainer'],
  ['onAlertRed', 'alertRed'],
  ['onAlertRedContainer', 'alertRedContainer'],
  ['onAlertYellow', 'alertYellow'],
  ['onAlertYellowContainer', 'alertYellowContainer'],
  ['onRelief', 'relief'],
  ['onReliefContainer', 'reliefContainer'],
  ['onSimulatedContainer', 'simulatedContainer'],
  ['inverseOnSurface', 'inverseSurface'],
  ...(
    [
      'surface',
      'surfaceContainerLowest',
      'surfaceContainerLow',
      'surfaceContainer',
      'surfaceContainerHigh',
      'surfaceContainerHighest',
    ] as Role[]
  ).flatMap((s): [Role, Role][] => [
    ['onSurface', s],
    ['onSurfaceVariant', s],
    ['primary', s],
    ['error', s],
  ]),
];

/** Borders, focus rings, chart marks and icons that carry meaning: 3:1 against the page. */
const markPairs: [Role, Role][] = [
  ['outline', 'surface'],
  ['focusRing', 'surface'],
  ['focusRing', 'surfaceContainerHigh'],
  ['simulated', 'surface'],
  ['relief', 'surface'],
  ['tertiary', 'surface'],
  ['alertRed', 'surface'],
];

describe.each(Object.entries(color))('%s theme', (_, roles) => {
  it.each(textPairs)('%s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrastRatio(roles[fg], roles[bg])).toBeGreaterThanOrEqual(4.5);
  });
  it.each(markPairs)('%s on %s is at least 3:1', (fg, bg) => {
    expect(contrastRatio(roles[fg], roles[bg])).toBeGreaterThanOrEqual(3);
  });
});

describe('helpers', () => {
  it('computes known contrast ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
  it('appends alpha to a hex colour', () => {
    expect(withAlpha('#3238A5', 0.08)).toBe('#3238A514');
    expect(withAlpha('#3238A5', 1)).toBe('#3238A5FF');
  });
});
