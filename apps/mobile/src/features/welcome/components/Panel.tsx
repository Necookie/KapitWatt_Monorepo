import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@/styles/theme';

const c = themes.light.color;

/** One story panel: a small label, the headline, then the picture and its line. */
export function Panel(props: {
  width: number;
  height: number;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.panel, { width: props.width, height: props.height || undefined }]}>
      <View style={styles.heading}>
        <Text variant="labelLarge" style={styles.kicker}>
          {props.kicker}
        </Text>
        <Text
          variant="headlineSmall"
          align="center"
          accessibilityRole="header"
          style={styles.title}
        >
          {props.title}
        </Text>
      </View>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingHorizontal: space.xl,
  },
  heading: { alignItems: 'center', gap: space.xs },
  kicker: { color: c.tertiaryContainer, textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: c.onBrand },
});
