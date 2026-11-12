import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { Txt } from './Txt';

/** Uppercase micro-label above a value or a group. */
export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Txt size="xs" tone="muted" weight="600" style={[styles.label, style]}>
      {children}
    </Txt>
  );
}

const styles = StyleSheet.create({
  label: { letterSpacing: 0.4, textTransform: 'uppercase' },
});
