import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

const c = themes.light.color;
const ON_SOFT = withAlpha(c.onBrand, 0.78);

export function Body({ children }: { children: ReactNode }) {
  return (
    <Text variant="bodyMedium" align="center" style={styles.body}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: { color: ON_SOFT, maxWidth: 340 },
});
