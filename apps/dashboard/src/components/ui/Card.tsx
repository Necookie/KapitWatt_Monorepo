import { SkeletonText } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, space } from '@/styles/theme';
import { Txt } from './Txt';
import { motion } from '@/styles/motion';

export function Card({
  title,
  aside,
  children,
  style,
  padded = true,
  loading = false,
  skeleton,
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** Show a skeleton in place of the body; the title stays, so the layout does not jump. */
  loading?: boolean;
  /** A skeleton shaped like the body; three lines of text by default. */
  skeleton?: ReactNode;
}) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.cardHeader}>
          <Txt tone="ink" weight="600">
            {title}
          </Txt>
          {aside}
        </View>
      ) : null}
      {loading ? (
        <View accessibilityLabel="Loading" style={padded || !skeleton ? styles.cardBody : null}>
          {skeleton ?? <SkeletonText />}
        </View>
      ) : (
        // Keyed apart from the skeleton so the body fades in when it replaces it.
        <View key="body" style={[padded ? styles.cardBody : null, motion.fadeIn]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    minHeight: 40,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardBody: { padding: space.lg },
});
