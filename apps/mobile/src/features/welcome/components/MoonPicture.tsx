import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SIZE } from '../utils/hold-ring';
import { FitPicture } from './FitPicture';

const c = themes.light.color;

/**
 * Every story panel's picture, so Alitaptap's moon sits in the same place on each: one box the size
 * of the try-it's ring (fitted to the room, so all three shrink alike on a short screen) and a
 * one-line hint row under it, kept even when empty. Only the try-it fills the hint.
 */
export function MoonPicture({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <View style={styles.wrap}>
      <FitPicture>
        <View style={styles.box}>{children}</View>
      </FitPicture>
      <Text
        variant="labelLarge"
        style={styles.hint}
        accessibilityLiveRegion={hint ? 'polite' : undefined}
        accessibilityElementsHidden={!hint}
        importantForAccessibility={hint ? 'auto' : 'no-hide-descendants'}
      >
        {hint ?? ' '}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 12 },
  box: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  hint: { color: withAlpha(c.onBrand, 0.78) },
});
