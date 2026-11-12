import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { fonts, radius, space } from '@/styles/theme';

const c = themes.light.color;

export function Section(props: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="labelMedium" color="onSurfaceVariant" style={styles.sectionTitle}>
        {props.title.toUpperCase()}
      </Text>
      <View style={styles.card}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  sectionTitle: { fontFamily: fonts.semibold, letterSpacing: 0.8, paddingHorizontal: space.xs },
  card: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    overflow: 'hidden',
  },
});
