import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@/styles/theme';
import { Txt } from './Txt';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={{ flexShrink: 1, gap: 2 }}>
        <Txt size="xl" tone="ink" weight="600" accessibilityRole="header">
          {title}
        </Txt>
        {subtitle ? (
          <Txt size="sm" tone="muted">
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {actions ? <View style={styles.row}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.lg,
    flexWrap: 'wrap',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
});
