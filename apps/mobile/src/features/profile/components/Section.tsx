import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { fontFamily, radius, space } from '@kapitwatt/tokens';

const c = themes.light.color;

/**
 * A titled group on Profile: a small overline over one filled panel of rows, or (`plain`) over
 * cards that are their own surfaces (the bill stub and the meter faceplate).
 */
export function Section(props: { title: string; plain?: boolean; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="labelMedium" color="onSurfaceVariant" style={styles.sectionTitle}>
        {props.title.toUpperCase()}
      </Text>
      {props.plain ? (
        <View style={styles.plain}>{props.children}</View>
      ) : (
        <View style={styles.card}>{props.children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[2] },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.8,
    paddingHorizontal: space[1],
  },
  // A filled panel, like the lists on the other tabs.
  card: { borderRadius: radius.lg, backgroundColor: c.surfaceContainerLow, overflow: 'hidden' },
  plain: { gap: space[3] },
});
