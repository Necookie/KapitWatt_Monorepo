import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@kapitwatt/tokens';
import { CAPTION_SLOT, SHORT_PANEL } from '../utils/story';

const c = themes.light.color;

/**
 * One story panel: a small label, the headline, then the picture and its line. The panel has a fixed
 * shape: the picture gets the room left between the heading and a fixed slot for the line (it fits
 * itself to that room with FitPicture), so the panel never spills over the top bar or the street,
 * and swapping the line (the try-it's line for its reward chip) moves nothing.
 */
export function Panel(props: {
  width: number;
  height: number;
  kicker: string;
  title: string;
  picture: ReactNode;
  caption: ReactNode;
}) {
  return (
    <View
      style={[
        styles.panel,
        props.height > 0 && props.height < SHORT_PANEL && styles.compact,
        { width: props.width, height: props.height || undefined },
      ]}
    >
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
      <View style={styles.picture}>{props.picture}</View>
      <View style={styles.caption}>{props.caption}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 32 below the logo row, 24 between heading, picture and line, and 24 above the page dots.
  panel: {
    alignItems: 'center',
    gap: space[6],
    paddingHorizontal: space[6],
    paddingTop: space[8],
    paddingBottom: space[6],
  },
  // A short screen: a tighter rhythm, so the picture keeps a usable size.
  compact: { gap: space[4], paddingTop: space[4], paddingBottom: space[4] },
  picture: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  caption: { minHeight: CAPTION_SLOT, alignItems: 'center' },
  heading: { alignItems: 'center', gap: space[1] },
  kicker: { color: c.tertiaryContainer, textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: c.onBrand },
});
