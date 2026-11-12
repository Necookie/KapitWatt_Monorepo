import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, space } from '@/styles/theme';
import { TONES } from './tones';
import { Txt } from './Txt';

export function Notice({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'warning' | 'critical' | 'brand';
  children: ReactNode;
}) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.notice, { backgroundColor: bg, borderColor: fg }]}>
      <Txt size="sm" style={{ color: fg }}>
        {children}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderLeftWidth: 3,
  },
});
